'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { requireRole, checkOwnership } = require('../src/middleware/auth');

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

test('requireRole rejects unauthenticated requests', () => {
  const res = responseRecorder();
  let called = false;

  requireRole('admin')({}, res, () => { called = true; });

  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
});

test('requireRole rejects a role outside the allowlist', () => {
  const res = responseRecorder();
  let called = false;

  requireRole('admin', 'gerente')({ user: { role: 'operador' } }, res, () => { called = true; });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.payload.requiredRoles, ['admin', 'gerente']);
});

test('requireRole allows an authorized role', () => {
  const res = responseRecorder();
  let called = false;

  requireRole('admin', 'gerente')({ user: { role: 'gerente' } }, res, () => { called = true; });

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});

test('checkOwnership prevents an operator from reading another operator', () => {
  const res = responseRecorder();
  let called = false;
  const req = { user: { role: 'operador', operator_id: 7 }, params: { id: '8' } };

  checkOwnership(req, res, () => { called = true; });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('checkOwnership allows managers and the matching operator', () => {
  for (const req of [
    { user: { role: 'gerente' }, params: { id: '99' } },
    { user: { role: 'operador', operator_id: 7 }, params: { id: '7' } }
  ]) {
    const res = responseRecorder();
    let called = false;
    checkOwnership(req, res, () => { called = true; });
    assert.equal(called, true);
  }
});
