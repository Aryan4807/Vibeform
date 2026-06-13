const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  loadCatalog,
  buildRawUrl,
  downloadTemplate,
  downloadAllTemplates,
} = require('../scripts/download-templates');

const catalogPath = path.join(__dirname, '..', 'catalog.json');

test('loadCatalog returns 12 templates with unique filenames', () => {
  const entries = loadCatalog(catalogPath);

  assert.equal(entries.length, 12);

  const filenames = entries.map((entry) => entry.filename);
  assert.equal(new Set(filenames).size, filenames.length);
});

test('each catalog entry includes source provenance for downloads', () => {
  const entries = loadCatalog(catalogPath);

  entries.forEach((entry) => {
    assert.ok(entry.sourceRepo, `missing sourceRepo for ${entry.filename}`);
    assert.ok(entry.sourcePath, `missing sourcePath for ${entry.filename}`);
    assert.match(entry.sourceRepo, /^CommonPaper\//);
    assert.match(entry.sourcePath, /^main\/.+\.md$/);
  });
});

test('buildRawUrl constructs CommonPaper raw GitHub URLs', () => {
  const entries = loadCatalog(catalogPath);
  const csa = entries.find((entry) => entry.filename === 'CSA.md');

  assert.equal(
    buildRawUrl(csa),
    'https://raw.githubusercontent.com/CommonPaper/CSA/main/CSA.md',
  );
});

test('downloadTemplate writes fetched content to templates directory', async () => {
  const entry = loadCatalog(catalogPath).find((item) => item.filename === 'sla.md');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibeform-download-'));

  try {
    const mockFetch = async () => ({
      ok: true,
      status: 200,
      text: async () => '# Service Level Agreement\n',
    });

    const destination = await downloadTemplate(entry, {
      fetchImpl: mockFetch,
      templatesDir: tempDir,
    });

    assert.equal(destination, path.join(tempDir, 'sla.md'));
    assert.match(fs.readFileSync(destination, 'utf8'), /Service Level Agreement/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('downloadAllTemplates downloads every catalog entry', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibeform-download-'));
  const entries = loadCatalog(catalogPath);

  try {
    const mockFetch = async (url) => ({
      ok: true,
      status: 200,
      text: async () => `content for ${url}\n`,
    });

    const results = await downloadAllTemplates({
      fetchImpl: mockFetch,
      catalogPath,
      templatesDir: tempDir,
    });

    assert.equal(results.length, entries.length);
    entries.forEach((entry) => {
      const filePath = path.join(tempDir, entry.filename);
      assert.ok(fs.existsSync(filePath), `missing downloaded file: ${entry.filename}`);
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('downloadTemplate rejects failed HTTP responses', async () => {
  const entry = loadCatalog(catalogPath)[0];
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibeform-download-'));

  try {
    const mockFetch = async () => ({
      ok: false,
      status: 404,
      text: async () => 'not found',
    });

    await assert.rejects(
      () => downloadTemplate(entry, { fetchImpl: mockFetch, templatesDir: tempDir }),
      /HTTP 404/,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
