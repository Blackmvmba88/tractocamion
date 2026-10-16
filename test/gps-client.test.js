'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/public/gps.js'),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){
  const nodes=new Map(),handlers={};
  const node=()=>({value:'TRK-001',disabled:false,hidden:false,textContent:'',className:'',addEventListener(name,fn){this[name]=fn;},replaceChildren(){},append(){},querySelector(){return node();}});
  const document={getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node};
  let callback,cleared=0,sends=0,interval;
  const geo={watchPosition(success){callback=success;return 0;},clearWatch(id){assert.equal(id,0);cleared++;}};
  const window={isSecureContext:true,addEventListener(name,fn){handlers[name]=fn;},location:{replace(){}},authUtils:{isAuthenticated:()=>true,getUser:()=>({role:'operador'}),authFetch:async(url)=>{if(url==='/api/gps/units')return {ok:true,json:async()=>({trucks:[{id:'TRK-001',plate:'ABC-123'}]})};sends++;return {ok:true,status:200,json:async()=>({success:true})};}}};
  vm.runInNewContext(source,{document,window,navigator:{geolocation:geo},setInterval(fn){interval=fn;return 0;},clearInterval(){interval=null;},setTimeout(){return 1;},clearTimeout(){},AbortController,Date,console});
  return {nodes,window,fix:()=>callback({coords:{latitude:19,longitude:-99,accuracy:5,speed:null,heading:null},timestamp:Date.now()}),get sends(){return sends;},get cleared(){return cleared;},get interval(){return interval;}};
}
test('GPS requires an explicit start and stops watch ID zero, timer and late callbacks',async()=>{
  const app=setup();await tick();assert.equal(app.sends,0);
  app.nodes.get('gps-start').click();app.fix();await tick();assert.equal(app.sends,1);
  assert.equal(app.nodes.get('gps-unit').disabled,true);
  app.nodes.get('gps-stop').click();assert.equal(app.cleared,1);assert.equal(app.interval,null);
  app.fix();await tick();assert.equal(app.sends,1);assert.equal(app.nodes.get('gps-unit').disabled,false);
});
test('an insecure phone URL never starts geolocation',async()=>{
  const app=setup();await tick();app.window.isSecureContext=false;
  app.nodes.get('gps-start').click();assert.equal(app.sends,0);assert.match(app.nodes.get('gps-status').textContent,/HTTPS/);
});
