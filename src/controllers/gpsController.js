'use strict';
const crypto = require('node:crypto');
const { Op } = require('sequelize');
const { Truck, GpsDevice, sequelize } = require('../models');
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
const isManager = user => ['admin','gerente'].includes(user?.role);
const scope = user => isManager(user) ? {} : { current_operator_id: user?.operator_id || -1 };
const publicDevice = ['id','truck_id','name','createdAt','revoked_at','last_seen_at'];

function validateFix(body, now = Date.now(), requireAccuracy = true) {
  const { latitude, longitude, accuracy, speed, heading, observed_at } = body;
  const numeric = n => typeof n === 'number' && Number.isFinite(n);
  if (!numeric(latitude) || Math.abs(latitude)>90 || !numeric(longitude) || Math.abs(longitude)>180) return {error:'Coordenadas inválidas'};
  if ((accuracy == null && requireAccuracy) || (accuracy != null && (!numeric(accuracy) || accuracy<0 || accuracy>100000))) return {error:'Precisión inválida (metros)'};
  if (speed != null && (!numeric(speed) || speed<0 || speed>150)) return {error:'Velocidad inválida (m/s)'};
  if (heading != null && (!numeric(heading) || heading<0 || heading>=360)) return {error:'Rumbo inválido (0 a menos de 360 grados)'};
  const timestamp = typeof observed_at === 'string' ? Date.parse(observed_at) : NaN;
  if (!Number.isFinite(timestamp) || timestamp<now-120000 || timestamp>now+30000) return {error:'La posición debe tener una fecha válida de los últimos 2 minutos'};
  return {values:{latitude,longitude,position_updated_at:new Date(timestamp),position_received_at:new Date(now),position_accuracy:accuracy ?? null,position_speed:speed ?? null,position_heading:heading ?? null}};
}
exports.validateFix = validateFix;

exports.units = async (req,res,next) => {
  try { res.json({trucks:await Truck.findAll({where:scope(req.user),attributes:['id','plate','status']})}); } catch(e){next(e);}
};
exports.devices = async (req,res,next) => {
  try { res.json({devices:await GpsDevice.findAll({attributes:publicDevice,order:[['createdAt','DESC']]})}); } catch(e){next(e);}
};
exports.createDevice = async (req,res,next) => {
  try {
    const {truck_id,name} = req.body;
    if(typeof name !== 'string' || !name.trim() || name.length>100 || typeof truck_id !== 'string') return res.status(400).json({error:'Indica unidad y nombre del rastreador (hasta 100 caracteres)'});
    if(!await Truck.findByPk(truck_id)) return res.status(404).json({error:'Unidad no encontrada'});
    const token='bmgps_'+crypto.randomBytes(32).toString('hex');
    const device=await GpsDevice.create({truck_id,name:name.trim(),token_hash:hash(token)});
    res.set('Cache-Control','no-store');
    res.status(201).json({device:{id:device.id,truck_id,name:device.name},token});
  } catch(e){next(e);}
};
exports.revokeDevice = async (req,res,next) => {
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(req.params.id)) return res.status(400).json({error:'Identificador inválido'});
  try {
    const [count]=await GpsDevice.update({revoked_at:new Date()},{where:{id:req.params.id}});
    res.status(count ? 200 : 404).json(count ? {success:true} : {error:'Rastreador no encontrado'});
  } catch(e){next(e);}
};
async function saveFix(values, truckId, where, transaction) {
  return Truck.update(values,{where:{id:truckId,...where,[Op.or]:[{position_updated_at:null},{position_updated_at:{[Op.lt]:values.position_updated_at}}]},transaction});
}
exports.phone = async (req,res,next) => {
  const result=validateFix(req.body);
  if(result.error) return res.status(400).json({error:result.error});
  try {
    const where={id:req.params.id,...scope(req.user)};
    if(!await Truck.findOne({where,attributes:['id']})) return res.status(403).json({error:'Sólo puedes transmitir para una unidad asignada a tu operador'});
    const values={...result.values,position_source:'phone_gps'};
    const [count]=await saveFix(values,req.params.id,scope(req.user));
    if(!count) return res.status(409).json({error:'Posición antigua, duplicada o unidad reasignada'});
    res.json({success:true,position:values});
  } catch(e){next(e);}
};
exports.tracker = async (req,res,next) => {
  const token=(req.headers.authorization || '').replace(/^Bearer /,'');
  if(!/^bmgps_[a-f0-9]{64}$/.test(token)) return res.status(401).json({error:'Credencial de rastreador inválida'});
  const result=validateFix(req.body, Date.now(), false);
  if(result.error) return res.status(400).json({error:result.error});
  try {
    const outcome=await sequelize.transaction(async transaction=>{
      const device=await GpsDevice.findOne({where:{token_hash:hash(token),revoked_at:null},transaction,lock:transaction.LOCK.UPDATE});
      if(!device) return 401;
      const [count]=await saveFix({...result.values,position_source:'tracker_gps'},device.truck_id,{},transaction);
      if(!count) return 409;
      await device.update({last_seen_at:new Date()},{transaction});
      return 200;
    });
    res.status(outcome).json(outcome===200 ? {success:true} : {error:outcome===401 ? 'Credencial revocada o inválida' : 'Posición antigua o duplicada'});
  } catch(e){next(e);}
};
