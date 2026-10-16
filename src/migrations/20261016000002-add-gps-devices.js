'use strict';
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async transaction => {
      for (const [name, type] of Object.entries({ position_received_at: S.DATE, position_accuracy: S.DOUBLE, position_speed: S.DOUBLE, position_heading: S.DOUBLE })) {
        await q.addColumn('Trucks', name, {type, allowNull:true}, {transaction});
      }
      await q.createTable('GpsDevices', {
        id: {type:S.UUID, primaryKey:true, allowNull:false},
        truck_id: {type:S.STRING, allowNull:false, references:{model:'Trucks',key:'id'}, onDelete:'CASCADE'},
        name: {type:S.STRING, allowNull:false},
        token_hash: {type:S.STRING(64), allowNull:false, unique:true},
        revoked_at: {type:S.DATE, allowNull:true}, last_seen_at: {type:S.DATE, allowNull:true},
        createdAt: {type:S.DATE,allowNull:false}, updatedAt: {type:S.DATE,allowNull:false}
      }, {transaction});
    });
  },
  async down(q) {
    await q.sequelize.transaction(async transaction => {
      await q.dropTable('GpsDevices',{transaction});
      for (const name of ['position_received_at','position_accuracy','position_speed','position_heading']) await q.removeColumn('Trucks',name,{transaction});
    });
  }
};
