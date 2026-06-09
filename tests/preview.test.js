const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');
const engine = require('../lib/templateEngine');

const coverTemplate = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'Mutual-NDA-coverpage.md'),
  'utf8',
);
const termsTemplate = fs.readFileSync(
  path.join(__dirname, '..', 'templates', 'Mutual-NDA.md'),
  'utf8',
);

const scenarios = [
  {
    name: 'default sample data',
    form: {
      ...engine.DEFAULT_FORM,
      party1: { name: 'Alice', title: 'CEO', company: 'Acme', noticeAddress: 'a@acme.com' },
      party2: { name: 'Bob', title: 'CTO', company: 'Beta', noticeAddress: 'b@beta.com' },
    },
  },
  {
    name: 'continuing term with perpetual confidentiality',
    form: {
      ...engine.DEFAULT_FORM,
      mndaTermType: 'continues',
      confidentialityType: 'perpetuity',
      modifications: 'Custom indemnity clause added.',
      party1: { name: 'Pat', title: 'Founder', company: 'North Co', noticeAddress: 'pat@north.co' },
      party2: { name: 'Sam', title: 'Founder', company: 'South Co', noticeAddress: 'sam@south.co' },
    },
  },
];

scenarios.forEach((scenario) => {
  test(`preview pipeline (${scenario.name}) renders non-empty HTML`, () => {
    const markdown = engine.renderDocument(coverTemplate, termsTemplate, scenario.form);
    const html = marked.parse(markdown, { async: false });

    assert.ok(markdown.trim().length > 0);
    assert.ok(html.trim().length > 0);
    assert.match(html, /<h1[^>]*>/);
    assert.doesNotMatch(markdown, /coverpage_link/);
  });
});

test('preview pipeline handles Windows CRLF source templates', () => {
  const crlfCover = coverTemplate.replace(/\n/g, '\r\n');
  const crlfTerms = termsTemplate.replace(/\n/g, '\r\n');
  const markdown = engine.renderDocument(crlfCover, crlfTerms, scenarios[0].form);
  const html = marked.parse(markdown, { async: false });

  assert.match(markdown, /Acme/);
  assert.match(html, /Acme/);
  assert.doesNotMatch(markdown, /\[Fill in state\]/);
});
