const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');

const app = require('../server');

test('GET / serves the template catalog page', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.match(response.text, /Common Paper Template Catalog/);
  assert.match(response.text, /\/js\/catalog\.js/);
  assert.match(response.text, /creator-grid/);
  assert.match(response.text, /template-grid/);
});

test('GET /nda serves the Mutual NDA creator page', async () => {
  const response = await request(app).get('/nda');

  assert.equal(response.status, 200);
  assert.match(response.text, /Mutual NDA Creator/);
  assert.match(response.text, /\/vendor\/marked\.min\.js/);
  assert.match(response.text, /\/vendor\/html2pdf\.bundle\.min\.js/);
  assert.match(response.text, /\/lib\/templateEngine\.js/);
  assert.match(response.text, /\/js\/shared\.js/);
  assert.match(response.text, /download-pdf-btn/);
  assert.match(response.text, /download-md-btn/);
});

test('GET /view/:filename serves the template preview shell for catalog entries', async () => {
  const response = await request(app).get('/view/CSA.md');

  assert.equal(response.status, 200);
  assert.match(response.text, /Template Preview/);
  assert.match(response.text, /\/js\/template-view\.js/);
});

test('GET /view/:filename returns 404 for unknown templates', async () => {
  const response = await request(app).get('/view/not-in-catalog.md');

  assert.equal(response.status, 404);
});

test('GET /api/catalog returns catalog metadata as JSON', async () => {
  const response = await request(app).get('/api/catalog');

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /json/);

  const catalog = response.body;
  assert.ok(Array.isArray(catalog.templates));
  assert.ok(Array.isArray(catalog.creators));
  assert.ok(catalog.templates.some((entry) => entry.filename === 'DPA.md'));
});

test('GET /health returns ok status', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('GET /vendor/marked.min.js serves local markdown renderer', async () => {
  const response = await request(app).get('/vendor/marked.min.js');

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /javascript/);
  assert.match(response.headers['cache-control'], /no-store/);
  assert.match(response.text, /marked/);
  assert.doesNotMatch(response.text, /^<!DOCTYPE html>/i);
});

test('GET /vendor/html2pdf.bundle.min.js serves local PDF renderer', async () => {
  const response = await request(app).get('/vendor/html2pdf.bundle.min.js');

  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /javascript/);
  assert.match(response.headers['cache-control'], /no-store/);
  assert.match(response.text, /html2pdf/);
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
