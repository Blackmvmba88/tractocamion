'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/models');
const userController = require('../src/controllers/userController');

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

test('user listing never returns password fields', async (t) => {
  t.mock.method(db.User, 'findAll', async () => [{
    id: 1,
    username: 'admin',
    email: 'admin@example.test',
    password: 'must-not-leak',
    role: 'admin',
    operator_id: null,
    is_active: true,
    operator: null
  }]);
  const res = responseRecorder();

  await userController.listUsers({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.total, 1);
  assert.equal(Object.hasOwn(res.payload.users[0], 'password'), false);
});

test('the last active admin cannot be deactivated', async (t) => {
  const admin = {
    id: 1,
    role: 'admin',
    operator_id: null,
    is_active: true
  };
  t.mock.method(db.sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(db.User, 'findByPk', async () => admin);
  t.mock.method(db.User, 'count', async () => 1);
  const res = responseRecorder();

  await userController.updateUser({ params: { id: '1' }, body: { is_active: false } }, res);

  assert.equal(res.statusCode, 409);
  assert.match(res.payload.error, /último administrador/);
});

test('an operator cannot be linked to two user accounts', async (t) => {
  let userLookup = 0;
  t.mock.method(db.sequelize, 'transaction', async (callback) => callback({}));
  t.mock.method(db.Operator, 'findByPk', async () => ({ id: 8 }));
  t.mock.method(db.User, 'findOne', async () => {
    userLookup += 1;
    return userLookup === 1 ? null : { id: 99 };
  });
  const res = responseRecorder();
  const req = {
    body: {
      username: 'operator8',
      email: 'operator8@example.test',
      password: 'Temporary8A',
      role: 'operador',
      operator_id: 8
    }
  };

  await userController.createUser(req, res);

  assert.equal(res.statusCode, 409);
  assert.match(res.payload.error, /ya tiene una cuenta/);
});
