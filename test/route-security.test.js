'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'server', 'index.js'),
  'utf8'
);

const protectedRoutes = [
  ['/processes', "authenticateToken, requireRole('admin', 'gerente')"],
  ['/trucks', "authenticateToken, requireRole('admin', 'gerente')"],
  ['/operators', "authenticateToken, requireRole('admin', 'gerente')"],
  ['/cycles', "authenticateToken, requireRole('admin', 'gerente')"],
  ['/analytics/dashboard', 'authenticateToken'],
  ['/analytics/alerts', "authenticateToken, requireRole('admin', 'gerente')"],
  ['/nfc/register', "authenticateToken, requireRole('admin', 'gerente')"],
  ['/nfc/unregister', "authenticateToken, requireRole('admin', 'gerente')"],
  ['/nfc/verify', 'authenticateToken'],
  ['/nfc/checkin', 'authenticateToken'],
  ['/users', "authenticateToken, requireRole('admin')"]
];

test('every operational route keeps its required authorization middleware', () => {
  for (const [route, middleware] of protectedRoutes) {
    const routePosition = serverSource.indexOf(`'${route}'`);
    assert.notEqual(routePosition, -1, `missing route ${route}`);
    const routeDeclaration = serverSource.slice(routePosition, routePosition + 180);
    assert.match(routeDeclaration, new RegExp(middleware.replace(/[()]/g, '\\$&')), `${route} lost ${middleware}`);
  }
});
