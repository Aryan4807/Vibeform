(function initApp() {
  const form = document.getElementById('nda-form');
  const preview = document.getElementById('preview');
  const previewStatus = document.getElementById('preview-status');
  const downloadMdBtn = document.getElementById('download-md-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');

  let coverTemplate = '';
  let termsTemplate = '';
  let latestMarkdown = '';

  function setStatus(message, isError = false) {
    if (!previewStatus) {
      return;
    }

    previewStatus.textContent = message;
    previewStatus.classList.toggle('is-error', isError);
  }

  function showFatalError(message) {
    setStatus(message, true);

    if (preview) {
      preview.innerHTML = `<p class="preview-error">${message}</p>`;
    }
  }

  function resolvePdfExporter() {
    if (typeof html2pdf === 'function') {
      return html2pdf;
    }

    if (typeof window !== 'undefined' && typeof window.html2pdf === 'function') {
      return window.html2pdf;
    }

    return null;
  }

  function warnIfPdfLibraryMissing() {
    if (resolvePdfExporter()) {
      return;
    }

    if (downloadPdfBtn) {
      downloadPdfBtn.disabled = true;
      downloadPdfBtn.title =
        'PDF library failed to load. Stop any old server on port 3000, run npm start, then hard-refresh.';
    }

    setStatus(
      'PDF export unavailable — stop the old server, run `npm start`, then hard-refresh (Ctrl+Shift+R).',
      true,
    );
  }

  function setDownloadEnabled(enabled) {
    if (downloadMdBtn) {
      downloadMdBtn.disabled = !enabled;
    }

    if (downloadPdfBtn) {
      downloadPdfBtn.disabled = !enabled || !resolvePdfExporter();
    }
  }

  function setFieldValue(id, value) {
    const field = document.getElementById(id);
    if (!field) {
      throw new Error(`Missing form field: ${id}`);
    }

    field.value = value;
  }

  function setRadioValue(name, value) {
    const input = form.querySelector(`input[name="${name}"][value="${value}"]`);
    if (!input) {
      throw new Error(`Missing radio option: ${name}=${value}`);
    }

    input.checked = true;
  }

  function readFormData(DEFAULT_FORM) {
    const formData = new FormData(form);

    return {
      purpose: formData.get('purpose')?.trim() || DEFAULT_FORM.purpose,
      effectiveDate: formData.get('effectiveDate') || DEFAULT_FORM.effectiveDate,
      mndaTermType: formData.get('mndaTermType') || DEFAULT_FORM.mndaTermType,
      mndaTermYears: Number(formData.get('mndaTermYears')) || DEFAULT_FORM.mndaTermYears,
      confidentialityType:
        formData.get('confidentialityType') || DEFAULT_FORM.confidentialityType,
      confidentialityYears:
        Number(formData.get('confidentialityYears')) || DEFAULT_FORM.confidentialityYears,
      governingLaw: formData.get('governingLaw')?.trim() || DEFAULT_FORM.governingLaw,
      jurisdiction: formData.get('jurisdiction')?.trim() || DEFAULT_FORM.jurisdiction,
      modifications: formData.get('modifications')?.trim() || '',
      party1: {
        name: formData.get('party1-name')?.trim() || '',
        title: formData.get('party1-title')?.trim() || '',
        company: formData.get('party1-company')?.trim() || '',
        noticeAddress: formData.get('party1-notice')?.trim() || '',
      },
      party2: {
        name: formData.get('party2-name')?.trim() || '',
        title: formData.get('party2-title')?.trim() || '',
        company: formData.get('party2-company')?.trim() || '',
        noticeAddress: formData.get('party2-notice')?.trim() || '',
      },
    };
  }

  function populateForm(DEFAULT_FORM) {
    setFieldValue('purpose', DEFAULT_FORM.purpose);
    setFieldValue('effectiveDate', DEFAULT_FORM.effectiveDate);
    setFieldValue('mndaTermYears', DEFAULT_FORM.mndaTermYears);
    setFieldValue('confidentialityYears', DEFAULT_FORM.confidentialityYears);
    setFieldValue('governingLaw', DEFAULT_FORM.governingLaw);
    setFieldValue('jurisdiction', DEFAULT_FORM.jurisdiction);
    setFieldValue('modifications', DEFAULT_FORM.modifications);
    setRadioValue('mndaTermType', DEFAULT_FORM.mndaTermType);
    setRadioValue('confidentialityType', DEFAULT_FORM.confidentialityType);
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

  function updatePreview(engine) {
    if (!coverTemplate || !termsTemplate) {
      return;
    }

    try {
      const formData = readFormData(engine.DEFAULT_FORM);
      latestMarkdown = engine.renderDocument(coverTemplate, termsTemplate, formData);

      if (!latestMarkdown.trim()) {
        throw new Error('Generated document is empty.');
      }

      preview.innerHTML = renderMarkdownToHtml(latestMarkdown);
      setStatus('Preview updated');
      setDownloadEnabled(true);
    } catch (error) {
      latestMarkdown = '';
      setDownloadEnabled(false);
      setStatus(`Preview error: ${error.message}`, true);
      preview.innerHTML = `<p class="preview-error">${error.message}</p>`;
    }
  }

  function downloadMarkdown(engine) {
    if (!latestMarkdown) {
      return;
    }

    const formData = readFormData(engine.DEFAULT_FORM);
    const blob = new Blob([latestMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = engine.buildDownloadFilename(formData);
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Markdown downloaded');
  }

  async function downloadPdf(engine) {
    if (!latestMarkdown || !preview?.innerHTML.trim()) {
      return;
    }

    const pdfExporter = resolvePdfExporter();
    if (!pdfExporter) {
      warnIfPdfLibraryMissing();
      return;
    }

    const formData = readFormData(engine.DEFAULT_FORM);

    try {
      setStatus('Generating PDF…');
      setDownloadEnabled(false);

      await pdfExporter()
        .from(preview)
        .set({
          filename: engine.buildPdfFilename(formData),
          margin: [10, 10, 10, 10],
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
        })
        .save();

      setStatus('PDF downloaded');
    } catch (error) {
      setStatus(`PDF error: ${error.message}`, true);
    } finally {
      setDownloadEnabled(Boolean(latestMarkdown));
    }
  }

  async function start() {
    if (!form || !preview || !downloadMdBtn || !downloadPdfBtn) {
      throw new Error('Application markup is missing required elements.');
    }

    if (!window.TemplateEngine) {
      throw new Error(
        'Template engine failed to load. Hard-refresh (Ctrl+Shift+R) or restart with `npm start`.',
      );
    }

    const engine = window.TemplateEngine;
    populateForm(engine.DEFAULT_FORM);
    setStatus('Loading templates…');
    setDownloadEnabled(false);

    const templates = await engine.loadTemplates();
    coverTemplate = templates.coverTemplate;
    termsTemplate = templates.termsTemplate;

    if (!coverTemplate.trim() || !termsTemplate.trim()) {
      throw new Error('Loaded templates are empty.');
    }

    setStatus('Ready');
    updatePreview(engine);
    warnIfPdfLibraryMissing();

    form.addEventListener('input', () => updatePreview(engine));
    downloadMdBtn.addEventListener('click', () => downloadMarkdown(engine));
    downloadPdfBtn.addEventListener('click', () => downloadPdf(engine));
  }

  start().catch((error) => {
    showFatalError(error.message || 'Application failed to start.');
  });
})();
