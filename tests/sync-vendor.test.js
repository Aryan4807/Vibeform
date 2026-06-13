const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { syncVendorAssets, vendorDir, vendorAssets } = require('../scripts/sync-vendor');

test('syncVendorAssets copies marked and html2pdf into public/vendor', () => {
  syncVendorAssets();

  vendorAssets.forEach(({ dest, src }) => {
    const target = path.join(vendorDir, dest);
    assert.ok(fs.existsSync(target), `missing synced vendor file: ${dest}`);
    assert.equal(fs.statSync(target).size, fs.statSync(src).size);
  });
});
