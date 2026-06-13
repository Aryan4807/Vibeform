const test = require('node:test');
const assert = require('node:assert/strict');
const { port } = require('../scripts/free-port');

test('free-port script exposes the configured port', () => {
  assert.equal(port, String(process.env.PORT || 3000));
});
