const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const engine = require('../lib/templateEngine');

const fixturesDir = path.join(__dirname, '..', 'templates');
const coverTemplate = fs.readFileSync(
  path.join(fixturesDir, 'Mutual-NDA-coverpage.md'),
  'utf8',
);
const termsTemplate = fs.readFileSync(path.join(fixturesDir, 'Mutual-NDA.md'), 'utf8');

const sampleForm = {
  ...engine.DEFAULT_FORM,
  effectiveDate: '2026-06-09',
  party1: {
    name: 'Alice Example',
    title: 'CEO',
    company: 'Acme Corp',
    noticeAddress: 'alice@acme.com',
  },
  party2: {
    name: 'Bob Example',
    title: 'CTO',
    company: 'Beta LLC',
    noticeAddress: 'bob@beta.com',
  },
};

test('normalizeLineEndings converts CRLF templates to LF', () => {
  assert.equal(engine.normalizeLineEndings('line1\r\nline2'), 'line1\nline2');
});

test('escapeMarkdown escapes HTML-sensitive characters', () => {
  assert.equal(engine.escapeMarkdown('<script>'), '&lt;script&gt;');
  assert.equal(engine.escapeMarkdown('A & B'), 'A &amp; B');
});

test('formatDisplayDate renders a stable UTC calendar date', () => {
  assert.equal(engine.formatDisplayDate('2026-06-09'), 'June 9, 2026');
  assert.equal(engine.formatDisplayDate(''), '');
});

test('buildMndaTermText supports expiry and continuation modes', () => {
  assert.match(
    engine.buildMndaTermText({ ...sampleForm, mndaTermType: 'expires', mndaTermYears: 2 }),
    /2 year\(s\)/,
  );
  assert.match(
    engine.buildMndaTermText({ ...sampleForm, mndaTermType: 'continues' }),
    /until terminated/,
  );
});

test('buildConfidentialityTermText supports fixed and perpetual terms', () => {
  assert.match(
    engine.buildConfidentialityTermText({ ...sampleForm, confidentialityType: 'fixed' }),
    /trade secrets/,
  );
  assert.equal(
    engine.buildConfidentialityTermText({ ...sampleForm, confidentialityType: 'perpetuity' }),
    'in perpetuity',
  );
});

test('renderCoverPage replaces all cover placeholders including CRLF templates', () => {
  const crlfTemplate = coverTemplate.replace(/\n/g, '\r\n');
  const output = engine.renderCoverPage(crlfTemplate, sampleForm);

  assert.match(output, /Acme Corp/);
  assert.match(output, /Beta LLC/);
  assert.match(output, /June 9, 2026/);
  assert.match(output, /Delaware/);
  assert.match(output, /New Castle, DE/);
  assert.doesNotMatch(output, /\[Fill in state\]/);
  assert.doesNotMatch(output, /\[Today/u);
  assert.doesNotMatch(output, /\[Evaluating whether to enter into a business relationship/);
});

test('renderStandardTerms replaces linked placeholders in standard terms', () => {
  const output = engine.renderStandardTerms(termsTemplate, sampleForm);

  assert.match(output, /Evaluating whether to enter into a business relationship/);
  assert.match(output, /June 9, 2026/);
  assert.match(output, /Delaware/);
  assert.doesNotMatch(output, /coverpage_link/);
});

test('renderDocument produces a complete markdown agreement', () => {
  const output = engine.renderDocument(coverTemplate, termsTemplate, sampleForm);

  assert.match(output, /# Mutual Non-Disclosure Agreement/);
  assert.match(output, /# Standard Terms/);
  assert.match(output, /\n---\n/);
  assert.match(output, /\| Print Name \| Alice Example \| Bob Example \|/);
  assert.ok(output.length > 1000);
});

test('buildDownloadFilename slugifies company names and includes date', () => {
  assert.equal(
    engine.buildDownloadFilename(sampleForm),
    'Mutual-NDA-acme-corp-beta-llc-2026-06-09.md',
  );
});

test('buildPdfFilename uses the same basename with a pdf extension', () => {
  assert.equal(
    engine.buildPdfFilename(sampleForm),
    'Mutual-NDA-acme-corp-beta-llc-2026-06-09.pdf',
  );
});

test('rendered markdown converts to non-empty HTML preview', () => {
  const markdown = engine.renderDocument(coverTemplate, termsTemplate, sampleForm);
  const html = marked.parse(markdown, { async: false });

  assert.ok(html.length > 500);
  assert.match(html, /<h1[^>]*>Mutual Non-Disclosure Agreement<\/h1>/);
  assert.match(html, /Acme Corp/);
});

test('loadTemplates rejects failed HTTP responses', async () => {
  await assert.rejects(
    () =>
      engine.loadTemplates(async () => ({
        ok: false,
        text: async () => '',
      })),
    /Unable to load NDA templates/,
  );
});

test('loadTemplates resolves template bodies on success', async () => {
  const result = await engine.loadTemplates(async (url) => ({
    ok: true,
    text: async () => (url.includes('coverpage') ? 'cover' : 'terms'),
  }));

  assert.equal(result.coverTemplate, 'cover');
  assert.equal(result.termsTemplate, 'terms');
});
