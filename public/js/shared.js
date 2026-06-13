(function initShared() {
  function resolvePdfExporter() {
    if (typeof html2pdf === 'function') {
      return html2pdf;
    }

    if (typeof window !== 'undefined' && typeof window.html2pdf === 'function') {
      return window.html2pdf;
    }

    return null;
  }

  function renderMarkdownToHtml(markdown) {
    if (typeof marked === 'undefined' || typeof marked.parse !== 'function') {
      throw new Error(
        'Markdown preview library failed to load. Hard-refresh (Ctrl+Shift+R) or restart with `npm start`.',
      );
    }

    const html = marked.parse(markdown, { async: false });

    if (html && typeof html.then === 'function') {
      throw new Error('Markdown preview returned an async result. Please refresh the page.');
    }

    return html;
  }

  function downloadMarkdownFile(markdown, filename) {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdfFromPreview(previewElement, filename) {
    const pdfExporter = resolvePdfExporter();
    if (!pdfExporter) {
      throw new Error(
        'PDF library failed to load. Stop any old server on port 3000, run npm start, then hard-refresh.',
      );
    }

    await pdfExporter()
      .from(previewElement)
      .set({
        filename,
        margin: [10, 10, 10, 10],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      })
      .save();
  }

  function buildTemplateDownloadName(filename, extension) {
    const base = filename.replace(/\.md$/i, '');
    return `${base}.${extension}`;
  }

  window.VibeformShared = {
    resolvePdfExporter,
    renderMarkdownToHtml,
    downloadMarkdownFile,
    downloadPdfFromPreview,
    buildTemplateDownloadName,
  };
})();
