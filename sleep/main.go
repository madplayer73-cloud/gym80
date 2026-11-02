// The web proxy has no Docker socket. An isolated agent exposes only state,
// start and graceful stop for an exact allowlisted container. No shell commands.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/netip"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
)

func env(k, fallback string) string {
	if s := os.Getenv(k); s != "" {
		return s
	}
	return fallback
}
func jsonReply(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}
func duration(k, fallback string) time.Duration {
	d, e := time.ParseDuration(env(k, fallback))
	if e != nil || d <= 0 {
		log.Fatalf("Invalid %s", k)
	}
	return d
}

// No published agent port. Only the proxy joins its isolated Docker network.
// The target name is configuration, never client input. Inspection is sanitized.
type agent struct {
	docker    *http.Client
	container string
}

func (a *agent) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	method, path := "", ""
	switch {
	case r.Method == "GET" && r.URL.Path == "/state":
		method, path = "GET", "/json"
	case r.Method == "POST" && r.URL.Path == "/start":
		method, path = "POST", "/start"
	case r.Method == "POST" && r.URL.Path == "/stop":
		method, path = "POST", "/stop?t=30"
	default:
		http.NotFound(w, r)
		return
	}
	if r.URL.RawQuery != "" {
		http.NotFound(w, r)
		return
	}
	req, _ := http.NewRequestWithContext(r.Context(), method, "http://docker/v1.41/containers/"+url.PathEscape(a.container)+path, nil)
	resp, err := a.docker.Do(req)
	if err != nil {
		jsonReply(w, 502, map[string]string{"error": "Docker unavailable"})
		return
	}
	defer resp.Body.Close()
	if path == "/json" && resp.StatusCode == 200 {
		var v struct {
			State struct {
				Running   bool
				OOMKilled bool
			}
		}
		if json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&v) != nil {
			jsonReply(w, 502, nil)
			return
		}
		jsonReply(w, 200, map[string]bool{"running": v.State.Running, "oom": v.State.OOMKilled})
		return
	}
	if resp.StatusCode == 204 || resp.StatusCode == 304 {
		jsonReply(w, 200, map[string]bool{"ok": true})
		return
	}
	jsonReply(w, 502, map[string]string{"error": fmt.Sprintf("Docker status %d", resp.StatusCode)})
}

type proxy struct {
	target, controller string
	health, api        *http.Client
	forward            *httputil.ReverseProxy
	// gate excludes stopping from all requests, including streaming uploads.
	gate              sync.RWMutex
	startMu           sync.Mutex
	mu                sync.Mutex
	last, started     time.Time
	state, lastError  string
	idle, wakeTimeout time.Duration
	disabled          bool
	stateFile         string
	now               func() time.Time
	retryAfter        time.Time
}

func newProxy(target, controller string, idle time.Duration) *proxy {
	u, e := url.Parse(target)
	if e != nil || u.Scheme != "http" || u.Host == "" {
		panic("Invalid target")
	}
	p := &proxy{target: strings.TrimSuffix(target, "/"), controller: strings.TrimSuffix(controller, "/"), idle: idle, wakeTimeout: 90 * time.Second, health: &http.Client{Timeout: 2 * time.Second}, api: &http.Client{Timeout: 40 * time.Second}, last: time.Now(), started: time.Now(), state: "idle", now: time.Now}
	p.forward = httputil.NewSingleHostReverseProxy(u)
	p.forward.ErrorHandler = func(w http.ResponseWriter, r *http.Request, e error) {
		p.setState("error", "Backend unavailable")
		jsonReply(w, 503, map[string]string{"error": "Gym80 sa nedá pripojiť. Skús znova."})
	}
	return p
}
func (p *proxy) setState(s, e string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.state != s {
		log.Printf("state=%s", s)
	}
	p.state, p.lastError = s, e
}
func (p *proxy) touch() { p.mu.Lock(); p.last = p.now(); p.mu.Unlock() }
func (p *proxy) call(ctx context.Context, method, path string) (map[string]bool, error) {
	req, _ := http.NewRequestWithContext(ctx, method, p.controller+path, nil)
	resp, e := p.api.Do(req)
	if e != nil {
		return nil, e
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("controller status %d", resp.StatusCode)
	}
	var v map[string]bool
	e = json.NewDecoder(io.LimitReader(resp.Body, 4096)).Decode(&v)
	return v, e
}
func (p *proxy) ready(ctx context.Context) (bool, int) {
	req, _ := http.NewRequestWithContext(ctx, "GET", p.target+"/health/ready", nil)
	resp, e := p.health.Do(req)
	if e != nil {
		return false, 0
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return false, 0
	}
	var v struct {
		OK   bool `json:"ok"`
		Busy int  `json:"busy"`
	}
	if json.NewDecoder(io.LimitReader(resp.Body, 4096)).Decode(&v) != nil {
		return false, 0
	}
	return v.OK, v.Busy
}
func (p *proxy) ensure(ctx context.Context) error {
	p.startMu.Lock()
	defer p.startMu.Unlock()
	if ok, _ := p.ready(ctx); ok {
		return nil
	}
	if p.now().Before(p.retryAfter) {
		return errors.New("wake cooldown")
	}
	p.retryAfter = p.now().Add(10 * time.Second)
	p.setState("starting", "")
	if _, e := p.call(ctx, "POST", "/start"); e != nil {
		p.setState("error", "Start failed")
		return e
	}
	deadline := time.Now().Add(p.wakeTimeout)
	for time.Now().Before(deadline) {
		if ok, _ := p.ready(ctx); ok {
			p.retryAfter = time.Time{}
			p.mu.Lock()
			p.started = p.now()
			p.mu.Unlock()
			p.setState("running", "")
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(250 * time.Millisecond):
		}
	}
	p.setState("error", "Start timed out")
	return errors.New("start timed out")
}
func privateClient(remote string) bool {
	host, _, e := net.SplitHostPort(remote)
	if e != nil {
		return false
	}
	ip, e := netip.ParseAddr(host)
	if e != nil {
		return false
	}
	ip = ip.Unmap()
	return ip.IsPrivate() || ip.IsLoopback() || netip.MustParsePrefix("100.64.0.0/10").Contains(ip)
}
func sameOrigin(r *http.Request) bool {
	u, e := url.Parse(r.Header.Get("Origin"))
	return e == nil && (u.Scheme == "http" || u.Scheme == "https") && strings.EqualFold(u.Host, r.Host)
}
func relevant(r *http.Request) bool {
	if r.Method != "GET" && r.Method != "HEAD" {
		return true
	}
	return r.Method == "GET" && strings.Contains(r.Header.Get("Accept"), "text/html") && r.Header.Get("Sec-Fetch-Dest") != "empty"
}
func (p *proxy) status(w http.ResponseWriter, r *http.Request) {
	state, e := p.call(r.Context(), "GET", "/state")
	p.mu.Lock()
	defer p.mu.Unlock()
	s := p.state
	if e != nil {
		s = "error"
	} else if !state["running"] {
		s = "stopped"
	} else if s != "starting" && s != "stopping" && s != "error" {
		s = "running"
		if p.now().Sub(p.last) > time.Minute {
			s = "idle"
		}
	}
	jsonReply(w, 200, map[string]any{"state": s, "autosleep": !p.disabled, "idleTimeoutSeconds": int(p.idle.Seconds()), "idleSeconds": int(p.now().Sub(p.last).Seconds()), "error": p.lastError})
}
func (p *proxy) sleep(ctx context.Context, manual bool) error {
	if !p.gate.TryLock() {
		return errors.New("busy")
	}
	defer p.gate.Unlock()
	p.mu.Lock()
	skip := !manual && (p.disabled || p.now().Sub(p.last) < p.idle || p.now().Sub(p.started) < time.Minute)
	p.mu.Unlock()
	if skip {
		return nil
	}
	info, e := p.call(ctx, "GET", "/state")
	if e != nil {
		return e
	}
	if !info["running"] {
		p.setState("stopped", "")
		return nil
	}
	// Fail closed if health cannot confirm that no writes/jobs are pending.
	ok, busy := p.ready(ctx)
	if !ok || busy > 0 {
		return errors.New("busy or unready")
	}
	p.setState("stopping", "")
	if _, e = p.call(ctx, "POST", "/stop"); e != nil {
		p.setState("error", "Stop failed")
		return e
	}
	p.setState("stopped", "")
	return nil
}
func (p *proxy) control(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" && r.URL.Path == "/__sleep" {
		p.status(w, r)
		return
	}
	if r.Method == "GET" && r.URL.Path == "/__sleep/ui" {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		_, _ = io.WriteString(w, controlHTML)
		return
	}
	if r.Method != "POST" || !sameOrigin(r) {
		jsonReply(w, 403, map[string]string{"error": "Použi ovládanie z tejto aplikácie."})
		return
	}
	switch r.URL.Path {
	case "/__sleep/activity", "/__sleep/wake":
		p.gate.RLock()
		defer p.gate.RUnlock()
		p.touch()
		if e := p.ensure(r.Context()); e != nil {
			jsonReply(w, 503, nil)
			return
		}
		jsonReply(w, 200, map[string]bool{"ok": true})
	case "/__sleep/sleep":
		if e := p.sleep(r.Context(), true); e != nil {
			jsonReply(w, 409, map[string]string{"error": "Aplikácia práve pracuje alebo nie je pripravená. Skús neskôr."})
			return
		}
		jsonReply(w, 200, map[string]bool{"ok": true})
	case "/__sleep/enable", "/__sleep/disable":
		disabled := r.URL.Path == "/__sleep/disable"
		p.mu.Lock()
		defer p.mu.Unlock()
		if p.stateFile != "" {
			if e := os.WriteFile(p.stateFile+".tmp", []byte(fmt.Sprint(disabled)), 0600); e != nil {
				jsonReply(w, 500, nil)
				return
			}
			if e := os.Rename(p.stateFile+".tmp", p.stateFile); e != nil {
				jsonReply(w, 500, nil)
				return
			}
		}
		p.disabled = disabled
		p.last = p.now()
		jsonReply(w, 200, map[string]bool{"ok": true})
	default:
		http.NotFound(w, r)
	}
}
func (p *proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Preserve existing LAN / private Tailscale trust. Forwarded IP headers never
	// grant access. Docker agent is not reachable from the app or host network.
	if !privateClient(r.RemoteAddr) {
		jsonReply(w, 403, nil)
		return
	}
	if r.Header.Get("Sec-Fetch-Site") == "cross-site" {
		jsonReply(w, 403, nil)
		return
	}
	if r.Method != "GET" && r.Method != "HEAD" && r.Header.Get("Origin") != "" && !sameOrigin(r) {
		jsonReply(w, 403, nil)
		return
	}
	if strings.HasPrefix(r.URL.Path, "/__sleep") {
		p.control(w, r)
		return
	}
	if r.URL.Path == "/health/live" {
		jsonReply(w, 200, map[string]bool{"ok": true})
		return
	}
	if r.URL.Path == "/health/ready" || r.URL.Path == "/sync/health" {
		ok, _ := p.ready(r.Context())
		if !ok {
			jsonReply(w, 503, map[string]bool{"ok": false})
			return
		}
		jsonReply(w, 200, map[string]bool{"ok": true})
		return
	}
	p.gate.RLock()
	defer p.gate.RUnlock()
	active := relevant(r)
	if !active && (r.URL.Path == "/favicon.ico" || strings.HasPrefix(r.URL.Path, "/assets/") || strings.HasPrefix(r.URL.Path, "/_expo/") || strings.HasPrefix(r.URL.Path, "/icons/") || r.URL.Path == "/sw.js" || r.URL.Path == "/manifest.webmanifest") {
		if ok, _ := p.ready(r.Context()); !ok {
			jsonReply(w, 503, nil)
			return
		}
	}
	if active {
		p.touch()
		defer p.touch()
	}
	if active && r.Method == "GET" {
		if ok, _ := p.ready(r.Context()); !ok {
			// The browser shows progress instead of a blank page or repeated 502s.
			go func() {
				p.gate.RLock()
				defer p.gate.RUnlock()
				ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
				defer cancel()
				_ = p.ensure(ctx)
			}()
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
			w.Header().Set("Retry-After", "3")
			w.WriteHeader(503)
			_, _ = io.WriteString(w, wakeHTML)
			return
		}
	}
	if e := p.ensure(r.Context()); e != nil {
		jsonReply(w, 503, map[string]string{"error": "Gym80 sa nepodarilo prebudiť. Skús obnoviť stránku."})
		return
	}
	// Bodies stream through the proxy. No replay or logging of personal data.
	p.forward.ServeHTTP(w, r)
}

const wakeHTML = `<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101014"><title>Prebúdzam Gym80</title><style>body{margin:0;background:#101014;color:white;font:18px system-ui;min-height:100vh;display:grid;place-items:center}main{max-width:340px;padding:24px;text-align:center}h1{color:#f58a26}p{line-height:1.6;color:#ddd}a{color:#f58a26}</style><main><h1>Gym80 sa prebúdza…</h1><p id="msg" role="status">Appka odpočívala, aby uvoľnila pamäť servera. O chvíľu môžeš pokračovať.</p><a href="/__sleep/ui">Ovládanie spánku</a></main><script>const start=Date.now();async function poll(){try{const s=await(await fetch('/__sleep',{cache:'no-store'})).json();if(s.state==='running'||s.state==='idle'){location.reload();return}if(s.state==='error'||Date.now()-start>90000){document.getElementById('msg').textContent='Prebudenie sa nepodarilo. Skús obnoviť stránku alebo otvor ovládanie spánku.';return}}catch{}setTimeout(poll,1500)}poll()</script></html>`

func main() {
	var handler http.Handler
	if env("ROLE", "proxy") == "agent" {
		name := env("CONTAINER", "gym80-tracker")
		if name != "gym80-tracker" && name != "gym80-sleep-test" {
			log.Fatal("Container not allowlisted")
		}
		client := &http.Client{Timeout: 40 * time.Second, Transport: &http.Transport{DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
			return (&net.Dialer{}).DialContext(ctx, "unix", env("DOCKER_SOCK", "/var/run/docker.sock"))
		}}}
		handler = &agent{docker: client, container: name}
	} else {
		p := newProxy(env("TARGET", "http://gym80-web:80"), env("CONTROLLER", "http://sleep-agent:8080"), duration("IDLE_TIMEOUT", "900s"))
		p.stateFile = env("STATE_FILE", "/state/disabled")
		if b, e := os.ReadFile(p.stateFile); e == nil {
			p.disabled = string(b) == "true"
		}
		handler = p
		go func() {
			for range time.NewTicker(10 * time.Second).C {
				ctx, cancel := context.WithTimeout(context.Background(), 40*time.Second)
				e := p.sleep(ctx, false)
				cancel()
				if e != nil && e.Error() != "busy" && e.Error() != "busy or unready" {
					log.Print("Idle controller unavailable")
				}
			}
		}()
	}
	srv := &http.Server{Addr: env("LISTEN", ":8080"), Handler: handler, ReadHeaderTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGTERM, os.Interrupt)
	go func() {
		<-signals
		ctx, cancel := context.WithTimeout(context.Background(), 35*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
	}()
	log.Print("Gym80 sleep service ready")
	if e := srv.ListenAndServe(); e != nil && e != http.ErrServerClosed {
		log.Fatal(e)
	}
}

const controlHTML = `<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101014"><title>Gym80 · Spánok</title><style>body{background:#101014;color:#fff;font:18px system-ui;max-width:480px;margin:8vh auto;padding:24px}h1{color:#f58a26}button,a{display:block;box-sizing:border-box;width:100%;padding:17px;margin:12px 0;border:0;border-radius:18px;font:inherit;background:#f58a26;color:#101014;text-align:center;text-decoration:none}p{line-height:1.6;color:#ddd}button:disabled{opacity:.5}#state{padding:22px;background:#242328;border-radius:18px}</style><h1>Gym80 · Úsporný režim</h1><p>Po 15 minútach nečinnosti appka zaspí. Otvorením Gym80 ju automaticky zobudíš. Uložené údaje zostávajú na serveri.</p><p id="state" role="status">Načítavam stav…</p><button onclick="act('wake')">Zobudiť aplikáciu</button><button onclick="act('sleep')">Uspať teraz</button><button id="auto" onclick="act(enabled?'disable':'enable')">Automatické uspávanie</button><a href="/">Otvoriť Gym80</a><script>let enabled=true;const labels={running:'Beží',idle:'Nečinná',stopped:'Spí',starting:'Prebúdza sa',stopping:'Zaspáva',error:'Nedostupná'};async function refresh(){try{const s=await(await fetch('/__sleep',{cache:'no-store'})).json();enabled=s.autosleep;document.getElementById('state').textContent=(labels[s.state]||s.state)+' · automatický spánok '+(enabled?'zapnutý':'vypnutý');document.getElementById('auto').textContent=enabled?'Vypnúť automatické uspávanie':'Zapnúť automatické uspávanie'}catch{document.getElementById('state').textContent='Server sa nedá pripojiť.'}}async function act(action){document.querySelectorAll('button').forEach(b=>b.disabled=true);document.getElementById('state').textContent=action==='wake'?'Prebúdzam Gym80…':'Pracujem…';try{const r=await fetch('/__sleep/'+action,{method:'POST'});if(!r.ok)throw Error();await refresh()}catch{document.getElementById('state').textContent='Akcia sa nepodarila. Appka môže práve ukladať dáta. Skús neskôr.'}finally{document.querySelectorAll('button').forEach(b=>b.disabled=false)}}refresh();setInterval(refresh,10000)</script></html>`
