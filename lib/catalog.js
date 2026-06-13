const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '..', 'catalog.json');

function loadCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

function findTemplate(filename) {
  const catalog = loadCatalog();
  return catalog.templates.find((entry) => entry.filename === filename) || null;
}

function listBrowseableTemplates() {
  const catalog = loadCatalog();
  return catalog.templates.filter(
    (entry) => !entry.filename.toLowerCase().includes('coverpage'),
  );
}

function listCreators() {
  const catalog = loadCatalog();
  return Array.isArray(catalog.creators) ? catalog.creators : [];
}

module.exports = {
  loadCatalog,
  findTemplate,
  listBrowseableTemplates,
  listCreators,
};
