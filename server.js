const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const templatesDir = path.join(__dirname, 'templates');
const libDir = path.join(__dirname, 'lib');
const markedPath = path.join(__dirname, 'node_modules', 'marked', 'marked.min.js');
const html2pdfPath = path.join(
  __dirname,
  'node_modules',
  'html2pdf.js',
  'dist',
  'html2pdf.bundle.min.js',
);

app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.md')) {
    res.set('Cache-Control', 'no-store');
  }

  next();
});

app.use(express.static(publicDir));
app.use('/lib', express.static(libDir));
app.use('/templates', express.static(templatesDir));

app.get('/vendor/marked.min.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(markedPath);
});

app.get('/vendor/html2pdf.bundle.min.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(html2pdfPath);
});

app.get('*', (req, res, next) => {
  if (req.path.includes('.')) {
    return next();
  }

  res.sendFile(path.join(publicDir, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Vibeform running at http://localhost:${PORT}`);
  });
}

module.exports = app;
