const express = require('express');
const path = require('path');
const { syncVendorAssets, vendorDir } = require('./scripts/sync-vendor');
const { loadCatalog, findTemplate } = require('./lib/catalog');

syncVendorAssets();

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const templatesDir = path.join(__dirname, 'templates');
const libDir = path.join(__dirname, 'lib');

app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.md')) {
    res.set('Cache-Control', 'no-store');
  }

  next();
});

app.get('/vendor/marked.min.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(vendorDir, 'marked.min.js'));
});

app.get('/vendor/html2pdf.bundle.min.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(vendorDir, 'html2pdf.bundle.min.js'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/catalog', (req, res) => {
  res.json(loadCatalog());
});

app.get('/nda', (req, res) => {
  res.sendFile(path.join(publicDir, 'nda.html'));
});

app.get('/view/:filename', (req, res) => {
  const template = findTemplate(req.params.filename);
  if (!template) {
    return res.status(404).type('text/plain').send('Template not found');
  }

  res.sendFile(path.join(publicDir, 'view.html'));
});

app.use(express.static(publicDir));
app.use('/lib', express.static(libDir));
app.use('/templates', express.static(templatesDir));

app.get('*', (req, res, next) => {
  if (req.path.includes('.')) {
    return next();
  }

  res.sendFile(path.join(publicDir, 'index.html'));
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Vibeform running at http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. Stop the old server or run \`npm start\` again to auto-free the port.`,
      );
      process.exit(1);
    }

    throw error;
  });
}

module.exports = app;
