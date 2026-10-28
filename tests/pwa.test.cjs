const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../public',name),'utf8');

test('installation manifest has standalone scope and real Android icon sizes',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'/');
  assert.equal(manifest.scope,'/');
  for(const size of [192,512]) {
    const icon=manifest.icons.find(icon=>icon.sizes===`${size}x${size}`);
    const png=fs.readFileSync(path.join(__dirname,'../public',icon.src));
    assert.equal(png.readUInt32BE(16),size);
    assert.equal(png.readUInt32BE(20),size);
  }
  assert.match(read('index.html'),/rel="manifest" href="\/manifest.webmanifest"/);
});

test('service worker never intercepts sync, uploads or external requests',async()=>{
  const handlers={};const cached=[];const offline={offline:true};let fail=false;
  vm.runInNewContext(read('sw.js'),{
    self:{location:{origin:'https://gym80.test'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},
    URL,fetch:async request=>{if(fail)throw Error('offline');return {url:request.url,fresh:true};},
    caches:{open:async()=>({add:async url=>cached.push(url)}),keys:async()=>[],match:async()=>offline}
  });
  let install;handlers.install({waitUntil:promise=>install=promise});await install;
  assert.deepEqual(cached,['/offline.html']);
  for(const request of [
    {method:'GET',mode:'cors',url:'https://gym80.test/sync/gym80'},
    {method:'GET',mode:'navigate',url:'https://gym80.test/sync/gym80'},
    {method:'GET',mode:'navigate',url:'https://gym80.test/pb/api/collections'},
    {method:'PUT',mode:'navigate',url:'https://gym80.test/sync/gym80'},
    {method:'GET',mode:'navigate',url:'https://other.test/'}
  ]) handlers.fetch({request,respondWith:()=>assert.fail('Personal data or external request was intercepted')});
  const request={method:'GET',mode:'navigate',url:'https://gym80.test/'};
  let response;handlers.fetch({request,respondWith:promise=>response=promise});assert.equal((await response).fresh,true);
  fail=true;handlers.fetch({request,respondWith:promise=>response=promise});assert.equal(await response,offline);
});

test('insecure HTTP never attempts service-worker registration',()=>{
  vm.runInNewContext(read('pwa-register.js'),{window:{isSecureContext:false,addEventListener:()=>assert.fail('Insecure registration')},navigator:{serviceWorker:{}}});
});
