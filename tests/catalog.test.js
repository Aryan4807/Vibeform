const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalogPath = path.join(__dirname, '..', 'catalog.json');
const templatesDir = path.join(__dirname, '..', 'templates');

test('catalog.json contains the mutual NDA templates used by the app', () => {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  assert.ok(Array.isArray(catalog.templates));
  assert.ok(catalog.templates.length >= 12);

  const filenames = catalog.templates.map((entry) => entry.filename);
  assert.ok(filenames.includes('Mutual-NDA.md'));
  assert.ok(filenames.includes('Mutual-NDA-coverpage.md'));
});

test('each catalog entry includes required metadata fields', () => {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  catalog.templates.forEach((entry) => {
    assert.ok(entry.name, `missing name for ${entry.filename}`);
    assert.ok(entry.description, `missing description for ${entry.filename}`);
    assert.ok(entry.filename, 'missing filename');
    assert.match(entry.filename, /\.md$/);
  });
});

test('catalog filenames are unique', () => {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const filenames = catalog.templates.map((entry) => entry.filename);
  const unique = new Set(filenames);

  assert.equal(unique.size, filenames.length);
});

test('templates directory includes CC BY 4.0 license notice', () => {
  const licenseText = fs.readFileSync(path.join(templatesDir, 'LICENSE.txt'), 'utf8');

  assert.match(licenseText, /CC BY 4\.0/);
  assert.match(licenseText, /Common Paper/);
});
