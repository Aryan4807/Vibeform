const fs = require('fs');
const vm = require('vm');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('public/js/templateEngine.js', 'utf8'), sandbox);

const { DEFAULT_FORM, renderDocument } = sandbox.window.TemplateEngine;
const coverTemplate = fs.readFileSync('templates/Mutual-NDA-coverpage.md', 'utf8');
const termsTemplate = fs.readFileSync('templates/Mutual-NDA.md', 'utf8');

const form = {
  ...DEFAULT_FORM,
  party1: { name: 'Alice', title: 'CEO', company: 'Acme', noticeAddress: 'a@acme.com' },
  party2: { name: 'Bob', title: 'CTO', company: 'Beta', noticeAddress: 'b@beta.com' },
};

const doc = renderDocument(coverTemplate, termsTemplate, form);
const failures = [];

if (!doc.includes('Alice')) failures.push('missing Alice');
if (!doc.includes('Acme')) failures.push('missing Acme');
if (!doc.includes('Delaware')) failures.push('missing Delaware');
if (doc.includes('[Fill in state]')) failures.push('state placeholder remains');
if (doc.includes('coverpage_link')) failures.push('coverpage_link remains');
if (!doc.includes('| Print Name | Alice | Bob |')) failures.push('party table not filled');
if (doc.includes('[Today')) failures.push('effective date placeholder remains');

if (failures.length) {
  console.error('FAILED:', failures.join(', '));
  process.exit(1);
}

console.log('All template checks passed.');
