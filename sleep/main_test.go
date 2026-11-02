package main

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

type rig struct {
	p                   *proxy
	mu                  sync.Mutex
	running             bool
	starts, stops, busy int
	clock               time.Time
	block               chan struct{}
	entered             chan struct{}
}

func makeRig(t *testing.T) *rig {
	t.Helper()
	x := &rig{running: true, clock: time.Now()}
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		x.mu.Lock()
		on, busy := x.running, x.busy
		block, entered := x.block, x.entered
		x.mu.Unlock()
		if !on {
			http.Error(w, "asleep", 503)
			return
		}
		if r.URL.Path == "/health/ready" {
			jsonReply(w, 200, map[string]any{"ok": true, "busy": busy})
			return
		}
		if r.URL.Path == "/upload" && block != nil {
			close(entered)
			<-block
		}
		w.WriteHeader(200)
		_, _ = io.WriteString(w, "saved")
	}))
	t.Cleanup(backend.Close)
	control := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		x.mu.Lock()
		defer x.mu.Unlock()
		switch r.URL.Path {
		case "/state":
			jsonReply(w, 200, map[string]bool{"running": x.running})
		case "/start":
			x.starts++
			x.running = true
			jsonReply(w, 200, map[string]bool{"ok": true})
		case "/stop":
			x.stops++
			x.running = false
			jsonReply(w, 200, map[string]bool{"ok": true})
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(control.Close)
	x.p = newProxy(backend.URL, control.URL, 900*time.Second)
	x.p.now = func() time.Time { x.mu.Lock(); defer x.mu.Unlock(); return x.clock }
	x.p.last = x.clock
	x.p.started = x.clock.Add(-2 * time.Minute)
	return x
}
func (x *rig) advance(d time.Duration) { x.mu.Lock(); x.clock = x.clock.Add(d); x.mu.Unlock() }
func request(p *proxy, method, path string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, "http://localhost"+path, nil)
	r.RemoteAddr = "192.168.1.50:1234"
	r.Header.Set("Origin", "http://localhost")
	w := httptest.NewRecorder()
	p.ServeHTTP(w, r)
	return w
}

func TestFifteenMinutesFromRealActivity(t *testing.T) {
	x := makeRig(t)
	x.advance(899 * time.Second)
	_ = x.p.sleep(context.Background(), false)
	if !x.running {
		t.Fatal("slept before 900s")
	}
	// Status, health, sync reads and static requests do not extend the deadline.
	for _, path := range []string{"/__sleep", "/sync/health", "/favicon.ico", "/sync/gym80", "/asset.js"} {
		if request(x.p, "GET", path).Code != 200 {
			t.Fatal(path)
		}
	}
	x.advance(time.Second)
	if e := x.p.sleep(context.Background(), false); e != nil {
		t.Fatal(e)
	}
	if x.running || x.stops != 1 {
		t.Fatal("did not stop at 900 seconds")
	}
}
func TestInputResetsTimerAndWakeWorks(t *testing.T) {
	x := makeRig(t)
	x.advance(899 * time.Second)
	if request(x.p, "POST", "/__sleep/activity").Code != 200 {
		t.Fatal("activity")
	}
	x.advance(899 * time.Second)
	_ = x.p.sleep(context.Background(), false)
	if !x.running {
		t.Fatal("activity ignored")
	}
	x.advance(time.Second)
	_ = x.p.sleep(context.Background(), false)
	if x.running {
		t.Fatal("not asleep")
	}
	// Passive health/status cannot wake a stopped container.
	request(x.p, "GET", "/__sleep")
	request(x.p, "GET", "/sync/health")
	request(x.p, "GET", "/favicon.ico")
	request(x.p, "GET", "/sw.js")
	if x.starts != 0 {
		t.Fatal("monitor woke app")
	}
	if request(x.p, "POST", "/sync/gym80").Code != 200 || x.starts != 1 {
		t.Fatal("write did not wake app")
	}
}
func TestBusyAndInflightCannotSleep(t *testing.T) {
	x := makeRig(t)
	x.advance(1000 * time.Second)
	x.busy = 1
	if x.p.sleep(context.Background(), false) == nil || !x.running {
		t.Fatal("busy backend stopped")
	}
	x.busy = 0
	x.block = make(chan struct{})
	x.entered = make(chan struct{})
	done := make(chan struct{})
	go func() { request(x.p, "POST", "/upload"); close(done) }()
	<-x.entered
	if x.p.sleep(context.Background(), true) == nil || !x.running {
		t.Fatal("upload stopped")
	}
	close(x.block)
	<-done
	if e := x.p.sleep(context.Background(), true); e != nil || x.running {
		t.Fatal("cannot stop completed upload", e)
	}
}
func TestMinimumUptimeAndDisable(t *testing.T) {
	x := makeRig(t)
	x.p.started = x.clock
	x.p.last = x.clock.Add(-1000 * time.Second)
	_ = x.p.sleep(context.Background(), false)
	if !x.running {
		t.Fatal("no wake grace")
	}
	x.advance(time.Minute)
	if request(x.p, "POST", "/__sleep/disable").Code != 200 {
		t.Fatal("disable")
	}
	x.advance(1000 * time.Second)
	_ = x.p.sleep(context.Background(), false)
	if !x.running {
		t.Fatal("disabled ignored")
	}
	request(x.p, "POST", "/__sleep/enable")
	x.advance(900 * time.Second)
	_ = x.p.sleep(context.Background(), false)
	if x.running {
		t.Fatal("enable ignored")
	}
}
func TestAgentHasExactAllowlistAndSanitizesInspect(t *testing.T) {
	var called []string
	docker := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = append(called, r.Method+" "+r.URL.RequestURI())
		if r.Method == "GET" {
			_, _ = io.WriteString(w, `{"State":{"Running":true},"Config":{"Env":["SECRET=hidden"]}}`)
		} else {
			w.WriteHeader(204)
		}
	}))
	defer docker.Close()
	client := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		u := *r.URL
		dest, _ := http.NewRequest(r.Method, docker.URL+u.RequestURI(), nil)
		return http.DefaultTransport.RoundTrip(dest)
	})}
	a := &agent{docker: client, container: "gym80-tracker"}
	for _, path := range []string{"/containers/tailscale/stop", "/start?container=tailscale", "/stop?x=1", "/exec", "/state?all=1"} {
		w := httptest.NewRecorder()
		a.ServeHTTP(w, httptest.NewRequest("POST", path, nil))
		if w.Code != 404 {
			t.Fatal(path)
		}
	}
	for _, v := range []struct{ method, path string }{{"GET", "/state"}, {"POST", "/start"}, {"POST", "/stop"}} {
		w := httptest.NewRecorder()
		a.ServeHTTP(w, httptest.NewRequest(v.method, v.path, nil))
		if w.Code != 200 || strings.Contains(w.Body.String(), "SECRET") {
			t.Fatal(w.Body.String())
		}
	}
	expected := []string{"GET /v1.41/containers/gym80-tracker/json", "POST /v1.41/containers/gym80-tracker/start", "POST /v1.41/containers/gym80-tracker/stop?t=30"}
	if strings.Join(called, "|") != strings.Join(expected, "|") {
		t.Fatal(called)
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func TestExternalNavigation(t *testing.T) {
	x := makeRig(t)
	for _, tc := range []struct{method, path, mode, dest string; code int}{
		{"GET", "/", "navigate", "document", 200},
		{"GET", "/", "cors", "empty", 403},
		{"GET", "/sync/gym80", "navigate", "document", 403},
		{"POST", "/__sleep/sleep", "navigate", "document", 403},
		{"GET", "/", "navigate", "iframe", 403},
	} {
		r := httptest.NewRequest(tc.method, "http://localhost"+tc.path, nil)
		r.RemoteAddr = "100.107.191.11:42"
		r.Header.Set("Sec-Fetch-Site", "cross-site")
		r.Header.Set("Sec-Fetch-Mode", tc.mode)
		r.Header.Set("Sec-Fetch-Dest", tc.dest)
		w := httptest.NewRecorder()
		x.p.ServeHTTP(w, r)
		if w.Code != tc.code { t.Fatalf("%+v: %d", tc, w.Code) }
	}
}

func TestAccessAndCsrf(t *testing.T) {
	x := makeRig(t)
	for _, ip := range []string{"8.8.8.8:42", "bad"} {
		r := httptest.NewRequest("GET", "http://localhost/", nil)
		r.RemoteAddr = ip
		w := httptest.NewRecorder()
		x.p.ServeHTTP(w, r)
		if w.Code != 403 {
			t.Fatal(ip)
		}
	}
	r := httptest.NewRequest("POST", "http://localhost/__sleep/sleep", nil)
	r.RemoteAddr = "100.107.191.11:42"
	r.Header.Set("Origin", "http://evil.test")
	w := httptest.NewRecorder()
	x.p.ServeHTTP(w, r)
	if w.Code != 403 || !x.running {
		t.Fatal("CSRF")
	}
	if !privateClient("100.107.191.11:42") || !privateClient("[::ffff:192.168.1.3]:42") {
		t.Fatal("private client denied")
	}
}

func TestHealthFailureNeverStopsAndConcurrentRequestsStartOnlyOnce(t *testing.T) {
	x := makeRig(t)
	x.p.target = "http://127.0.0.1:1"
	x.advance(1000 * time.Second)
	if x.p.sleep(context.Background(), false) == nil || x.stops != 0 {
		t.Fatal("unready app stopped")
	}
	x = makeRig(t)
	x.running = false
	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if request(x.p, "POST", "/sync/gym80").Code != 200 {
				t.Error("wake request failed")
			}
		}()
	}
	wg.Wait()
	if x.starts != 1 {
		t.Fatalf("duplicate starts: %d", x.starts)
	}
}
