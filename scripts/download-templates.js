const fs = require('fs');
const path = require('path');

const defaultCatalogPath = path.join(__dirname, '..', 'catalog.json');
const defaultTemplatesDir = path.join(__dirname, '..', 'templates');

function loadCatalog(catalogPath = defaultCatalogPath) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  if (!Array.isArray(catalog.templates) || catalog.templates.length === 0) {
    throw new Error('catalog.json must contain a non-empty templates array.');
  }

  return catalog.templates;
}

function buildRawUrl(entry) {
  if (!entry.sourceRepo || !entry.sourcePath) {
    throw new Error(`Missing source metadata for ${entry.filename || 'unknown template'}.`);
  }

  const [branch, ...fileParts] = entry.sourcePath.split('/');
  const file = fileParts.join('/');

  if (!branch || !file) {
    throw new Error(`Invalid sourcePath for ${entry.filename}: ${entry.sourcePath}`);
  }

  return `https://raw.githubusercontent.com/${entry.sourceRepo}/${branch}/${file}`;
}

async function downloadTemplate(entry, options = {}) {
  const { fetchImpl = fetch, templatesDir = defaultTemplatesDir } = options;
  const url = buildRawUrl(entry);
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${entry.filename} from ${url}: HTTP ${response.status}`);
  }

  const text = await response.text();
  const destination = path.join(templatesDir, entry.filename);

  fs.mkdirSync(templatesDir, { recursive: true });
  fs.writeFileSync(destination, text, 'utf8');

  return destination;
}

async function downloadAllTemplates(options = {}) {
  const {
    fetchImpl = fetch,
    catalogPath = defaultCatalogPath,
    templatesDir = defaultTemplatesDir,
  } = options;

  const entries = loadCatalog(catalogPath);
  const results = [];

  for (const entry of entries) {
    const destination = await downloadTemplate(entry, { fetchImpl, templatesDir });
    results.push({ filename: entry.filename, destination, url: buildRawUrl(entry) });
  }

  return results;
}

async function main() {
  try {
    const results = await downloadAllTemplates();
    console.log(`Downloaded ${results.length} template(s) to templates/`);
    results.forEach(({ filename, url }) => {
      console.log(`  - ${filename} <- ${url}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadCatalog,
  buildRawUrl,
  downloadTemplate,
  downloadAllTemplates,
};
