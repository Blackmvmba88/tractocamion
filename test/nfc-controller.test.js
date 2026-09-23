'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/models');
const nfcController = require('../src/controllers/nfcController');

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test('NFC verification rejects an operator using another operator tag', async (t) => {
  t.mock.method(db.Operator, 'findOne', async () => ({
    id: 8,
    code: 'OP-008',
    name: 'Otra persona',
    status: 'available'
  }));
  const req = {
    user: { role: 'operador', operator_id: 7 },
    body: { tag_id: 'TAG-OTHER' }
  };
  const res = responseRecorder();

  await nfcController.verifyTag(req, res);

  assert.equal(res.statusCode, 403);
  assert.match(res.payload.error, /otro operador/);
});

test('NFC verification allows the matching operator', async (t) => {
  t.mock.method(db.Operator, 'findOne', async () => ({
    id: 7,
    code: 'OP-007',
    name: 'Operador propio',
    status: 'available',
    total_cycles: 3,
    total_earnings: '150.00'
  }));
  const req = {
    user: { role: 'operador', operator_id: 7 },
    body: { tag_id: 'TAG-OWN' }
  };
  const res = responseRecorder();

  await nfcController.verifyTag(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.verified, true);
  assert.equal(res.payload.operator.id, 7);
});

test('NFC check-in rejects an operator using another operator tag', async (t) => {
  t.mock.method(db.Operator, 'findOne', async () => ({
    id: 9,
    code: 'OP-009',
    name: 'Operador ajeno',
    status: 'available'
  }));
  const req = {
    user: { role: 'operador', operator_id: 7 },
    body: { tag_id: 'TAG-OTHER', truck_id: 'TRK-001' }
  };
  const res = responseRecorder();

  await nfcController.quickCheckin(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.success, false);
});

test('NFC management remains available to managers', async (t) => {
  t.mock.method(db.Operator, 'findOne', async () => ({
    id: 9,
    code: 'OP-009',
    name: 'Operador administrado',
    status: 'available',
    total_cycles: 0,
    total_earnings: '0'
  }));
  const req = {
    user: { role: 'gerente' },
    body: { tag_id: 'TAG-MANAGED' }
  };
  const res = responseRecorder();

  await nfcController.verifyTag(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.operator.id, 9);
});
