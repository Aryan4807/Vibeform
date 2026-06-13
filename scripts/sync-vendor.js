const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const vendorDir = path.join(rootDir, 'public', 'vendor');

const vendorAssets = [
  {
    dest: 'marked.min.js',
    src: path.join(rootDir, 'node_modules', 'marked', 'marked.min.js'),
  },
  {
    dest: 'html2pdf.bundle.min.js',
    src: path.join(
      rootDir,
      'node_modules',
      'html2pdf.js',
      'dist',
      'html2pdf.bundle.min.js',
    ),
  },
];

function syncVendorAssets() {
  fs.mkdirSync(vendorDir, { recursive: true });

  vendorAssets.forEach(({ dest, src }) => {
    if (!fs.existsSync(src)) {
      throw new Error(`Missing vendor dependency: ${src}. Run npm install.`);
    }

    const target = path.join(vendorDir, dest);
    const sourceStat = fs.statSync(src);
    const targetStat = fs.existsSync(target) ? fs.statSync(target) : null;

    if (
      !targetStat ||
      targetStat.size !== sourceStat.size ||
      targetStat.mtimeMs < sourceStat.mtimeMs
    ) {
      fs.copyFileSync(src, target);
    }
  });
}

if (require.main === module) {
  syncVendorAssets();
  console.log('Synced vendor assets to public/vendor/');
}

module.exports = { syncVendorAssets, vendorDir, vendorAssets };
