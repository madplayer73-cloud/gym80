const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const {spawn} = require('node:child_process');

test('only trusted real input sends throttled activity; no idle timer or hidden-tab heartbeat', async () => {
  const code = await fs.readFile(path.join(__dirname, '../public/sleep-activity.js'), 'utf8');
  const events = {}; let now = 100000, calls = 0;
  const doc = {visibilityState: 'visible', addEventListener: (name, fn) => events[name] = fn};
  vm.runInNewContext(code, {document: doc, Date: {now: () => now}, fetch: async () => {calls++}});
  events.pointerdown({isTrusted:false}); assert.equal(calls, 0);
  events.pointerdown({isTrusted:true}); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 1);
  events.scroll({isTrusted:true}); assert.equal(calls, 1);
  now += 30001; doc.visibilityState='hidden'; events.input({isTrusted:true}); assert.equal(calls, 1);
  doc.visibilityState='visible'; events.keydown({isTrusted:true}); await new Promise(resolve => setImmediate(resolve)); assert.equal(calls, 2);
  assert.doesNotMatch(code, /setInterval|setTimeout/);
});

test('concurrent snapshot writes remain complete, ready reports work, and restarts preserve data', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'gym80-sleep-test-'));
  const probe = net.createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  let child;
  t.after(async () => { if(child && child.exitCode===null) child.kill(); await fs.rm(dir, {recursive:true,force:true}); });
  async function start() {
    child = spawn(process.execPath, [path.join(__dirname, '../server/app-server.js')], {env:{...process.env, PORT:String(port), DATA_DIR:dir, STATIC_DIR:dir},stdio:'ignore'});
    for(let i=0;i<100;i++) {try{if((await fetch(`http://127.0.0.1:${port}/health/ready`)).ok)return;}catch{} await new Promise(resolve=>setTimeout(resolve,50));}
    throw Error('server startup timeout');
  }
  await start(); const base = `http://127.0.0.1:${port}`;
  const responses = await Promise.all(Array.from({length:12}, (_,i)=>fetch(base+'/sync/gym80',{method:'PUT',body:JSON.stringify({marker:i,text:'x'.repeat(20000)})})));
  assert(responses.every(r=>r.ok));
  const stored=JSON.parse(await fs.readFile(path.join(dir,'gym80.json'),'utf8'));
  assert.equal(stored.text.length,20000); assert(stored.marker>=0&&stored.marker<12);
  const exited = new Promise(resolve=>child.once('exit',resolve)); child.kill('SIGTERM'); await exited;
  await start(); const reread=await (await fetch(base+'/sync/gym80')).json(); assert.deepEqual(reread.data,stored);
});
