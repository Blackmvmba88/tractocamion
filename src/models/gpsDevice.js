'use strict';
module.exports = (sequelize, D) => sequelize.define('GpsDevice', {
  id: {type:D.UUID, primaryKey:true, defaultValue:D.UUIDV4},
  truck_id: {type:D.STRING, allowNull:false}, name: {type:D.STRING,allowNull:false},
  token_hash: {type:D.STRING(64),allowNull:false,unique:true},
  revoked_at: D.DATE, last_seen_at: D.DATE
}, {tableName:'GpsDevices',timestamps:true});
