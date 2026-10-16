'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {Truck,GpsDevice}=require('../src/models');
const gps=require('../src/controllers/gpsController');
const res=()=>({code:200,status(n){this.code=n;return this;},json(body){this.body=body;return this;},set(){return this;}});
const sample=()=>({latitude:0,longitude:0,accuracy:5,speed:0,heading:0,observed_at:new Date().toISOString()});
test('GPS accepts valid zero values and rejects stale, future and malformed measurements',()=>{
  const now=Date.now();
  assert.equal(gps.validateFix(sample(),now).values.latitude,0);
  for(const patch of [{latitude:null},{latitude:'19'},{longitude:181},{accuracy:-1},{accuracy:null},{speed:-1},{heading:360},{observed_at:'invalid'},{observed_at:new Date(now-121000).toISOString()},{observed_at:new Date(now+31000).toISOString()}]) assert.ok(gps.validateFix({...sample(),...patch},now).error);
  assert.equal(gps.validateFix({...sample(),accuracy:null},now,false).values.position_accuracy,null);
});
test('operator cannot transmit for another unit',async t=>{
  t.mock.method(Truck,'findOne',async()=>null);
  const update=t.mock.method(Truck,'update',async()=>[1]);const response=res();
  await gps.phone({user:{role:'operador',operator_id:4},params:{id:'TRK-001'},body:sample()},response);
  assert.equal(response.code,403);assert.equal(update.mock.callCount(),0);
});
test('phone update rechecks assignment in the atomic update and uses server source',async t=>{
  t.mock.method(Truck,'findOne',async()=>({id:'TRK-001'}));
  const update=t.mock.method(Truck,'update',async()=>[1]);const response=res();
  await gps.phone({user:{role:'operador',operator_id:4},params:{id:'TRK-001'},body:{...sample(),position_source:'tracker_gps'}},response);
  const [values,options]=update.mock.calls[0].arguments;
  assert.equal(values.position_source,'phone_gps');assert.equal(options.where.current_operator_id,4);assert.ok(Object.getOwnPropertySymbols(options.where).length);
  assert.equal(response.code,200);
});
test('out-of-order phone position cannot replace newer data',async t=>{
  t.mock.method(Truck,'findOne',async()=>({id:'TRK-001'}));t.mock.method(Truck,'update',async()=>[0]);const response=res();
  await gps.phone({user:{role:'admin'},params:{id:'TRK-001'},body:sample()},response);assert.equal(response.code,409);
});
test('new hardware credential stores only its hash and listing excludes it',async t=>{
  t.mock.method(Truck,'findByPk',async()=>({id:'TRK-001'}));
  const create=t.mock.method(GpsDevice,'create',async values=>({...values,id:'test'}));const response=res();
  await gps.createDevice({body:{truck_id:'TRK-001',name:'Prototype'}},response);
  assert.equal(response.code,201);assert.match(response.body.token,/^bmgps_[a-f0-9]{64}$/);
  assert.equal(create.mock.calls[0].arguments[0].token_hash.length,64);assert.ok(!JSON.stringify(create.mock.calls[0].arguments[0]).includes(response.body.token));
  const listing=t.mock.method(GpsDevice,'findAll',async()=>[]);await gps.devices({},res());assert.ok(!listing.mock.calls[0].arguments[0].attributes.includes('token_hash'));
});
test('hardware ingestion rejects malformed credential before accessing DB',async t=>{
  const find=t.mock.method(GpsDevice,'findOne',async()=>null);const response=res();
  await gps.tracker({headers:{authorization:'Bearer random'},body:sample()},response);
  assert.equal(response.code,401);assert.equal(find.mock.callCount(),0);
});
