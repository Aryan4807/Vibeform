const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');

const app = require('../server');

test('GET / serves the NDA creator page', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.match(response.text, /Mutual NDA Creator/);
  assert.match(response.text, /\/vendor\/marked\.min\.js/);
  assert.match(response.text, /\/lib\/templateEngine\.js/);
});

test('GET /vendor/marked.min.js serves local markdown renderer', async () => {
  const response = await request(app).get('/vendor/marked.min.js');

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /javascript/);
  assert.match(response.headers['cache-control'], /no-store/);
  assert.match(response.text, /marked/);
  assert.doesNotMatch(response.text, /^<!DOCTYPE html>/i);
});

test('GET /lib/templateEngine.js serves shared template engine', async () => {
  const response = await request(app).get('/lib/templateEngine.js');

  assert.equal(response.status, 200);
  assert.match(response.text, /renderDocument/);
  assert.match(response.text, /window\.TemplateEngine/);
});

test('GET /js/app.js serves client application bundle', async () => {
  const response = await request(app).get('/js/app.js');

  assert.equal(response.status, 200);
  assert.match(response.text, /updatePreview/);
});

test('GET /templates/Mutual-NDA-coverpage.md serves cover template', async () => {
  const response = await request(app).get('/templates/Mutual-NDA-coverpage.md');

  assert.equal(response.status, 200);
  assert.match(response.text, /Mutual Non-Disclosure Agreement/);
});

test('GET /templates/Mutual-NDA.md serves standard terms template', async () => {
  const response = await request(app).get('/templates/Mutual-NDA.md');

  assert.equal(response.status, 200);
  assert.match(response.text, /Standard Terms/);
});

test('GET unknown asset paths return 404 instead of HTML shell', async () => {
  const response = await request(app).get('/missing-file.js');

  assert.equal(response.status, 404);
});

test('end-to-end template files exist on disk for all catalog entries', async () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'catalog.json'), 'utf8'),
  );

  catalog.templates.forEach((entry) => {
    const filePath = path.join(__dirname, '..', 'templates', entry.filename);
    assert.ok(fs.existsSync(filePath), `missing template file: ${entry.filename}`);
  });
});
