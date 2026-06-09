const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const request = require('supertest');

const app = require('../server');

test('browser startup serves JavaScript assets, not HTML shell', async () => {
  const [marked, engine, client] = await Promise.all([
    request(app).get('/vendor/marked.min.js'),
    request(app).get('/lib/templateEngine.js'),
    request(app).get('/js/app.js?v=2'),
  ]);

  for (const response of [marked, engine, client]) {
    assert.equal(response.status, 200);
    assert.doesNotMatch(response.text, /^<!DOCTYPE html>/i);
  }

  assert.match(marked.text, /marked v15/);
  assert.match(engine.text, /window\.TemplateEngine/);
  assert.match(client.text, /initApp/);
});

test('browser startup renders preview HTML from live asset pipeline', async () => {
  const markedRes = await request(app).get('/vendor/marked.min.js');
  const engineRes = await request(app).get('/lib/templateEngine.js');
  const coverRes = await request(app).get('/templates/Mutual-NDA-coverpage.md');
  const termsRes = await request(app).get('/templates/Mutual-NDA.md');

  const sandbox = {
    window: {},
    globalThis: {},
    fetch: async (url) => {
      const pathMap = {
        '/templates/Mutual-NDA-coverpage.md': coverRes,
        '/templates/Mutual-NDA.md': termsRes,
      };

      const response = pathMap[url];
      if (!response) {
        return { ok: false, status: 404, text: async () => '' };
      }

      return {
        ok: response.status === 200,
        status: response.status,
        text: async () => response.text,
      };
    },
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(markedRes.text, sandbox);
  vm.runInContext(engineRes.text, sandbox);

  const engine = sandbox.window.TemplateEngine;
  const { coverTemplate, termsTemplate } = await engine.loadTemplates(sandbox.fetch);
  const markdown = engine.renderDocument(coverTemplate, termsTemplate, engine.DEFAULT_FORM);
  const html = sandbox.marked.parse(markdown, { async: false });

  assert.ok(markdown.length > 1000);
  assert.ok(html.length > 1000);
  assert.match(html, /Mutual Non-Disclosure Agreement/);
});

test('index.html loads client scripts in dependency order', async () => {
  const response = await request(app).get('/');
  const markedIndex = response.text.indexOf('/vendor/marked.min.js');
  const engineIndex = response.text.indexOf('/lib/templateEngine.js');
  const appIndex = response.text.indexOf('/js/app.js');

  assert.ok(markedIndex >= 0);
  assert.ok(engineIndex > markedIndex);
  assert.ok(appIndex > engineIndex);
});
