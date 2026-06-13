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

  function createPdfExportNode(previewElement) {
    const clone = previewElement.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('pdf-export-clone');

    Object.assign(clone.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      maxHeight: 'none',
      height: 'auto',
      overflow: 'visible',
      width: `${previewElement.scrollWidth}px`,
      zIndex: '-1',
    });

    document.body.appendChild(clone);
    return clone;
  }

  async function downloadPdfFromPreview(previewElement, filename) {
    const pdfExporter = resolvePdfExporter();
    if (!pdfExporter) {
      throw new Error(
        'PDF library failed to load. Stop any old server on port 3000, run npm start, then hard-refresh.',
      );
    }

    const exportNode = createPdfExportNode(previewElement);

    try {
      await pdfExporter()
        .from(exportNode)
        .set({
          filename,
          margin: [10, 10, 10, 10],
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: exportNode.scrollWidth,
            windowHeight: exportNode.scrollHeight,
          },
          jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .save();
    } finally {
      exportNode.remove();
    }
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
