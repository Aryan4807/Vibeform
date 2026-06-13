const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadCatalog,
  findTemplate,
  listBrowseableTemplates,
  listCreators,
} = require('../lib/catalog');

test('loadCatalog returns templates and creators', () => {
  const catalog = loadCatalog();

  assert.ok(Array.isArray(catalog.templates));
  assert.ok(Array.isArray(catalog.creators));
  assert.ok(catalog.creators.length >= 1);
});

test('findTemplate returns metadata for known filenames', () => {
  const entry = findTemplate('CSA.md');

  assert.ok(entry);
  assert.equal(entry.name, 'Cloud Service Agreement');
});

test('findTemplate returns null for unknown filenames', () => {
  assert.equal(findTemplate('missing.md'), null);
});

test('listBrowseableTemplates excludes cover page entries', () => {
  const browseable = listBrowseableTemplates();

  assert.ok(browseable.length >= 11);
  assert.ok(browseable.every((entry) => !entry.filename.toLowerCase().includes('coverpage')));
});

test('listCreators includes the Mutual NDA creator', () => {
  const creators = listCreators();
  const mutualNda = creators.find((creator) => creator.id === 'mutual-nda');

  assert.ok(mutualNda);
  assert.equal(mutualNda.path, '/nda');
});
