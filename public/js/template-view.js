(function initTemplateView() {
  const preview = document.getElementById('preview');
  const previewStatus = document.getElementById('preview-status');
  const titleEl = document.getElementById('template-title');
  const descriptionEl = document.getElementById('template-description');
  const downloadMdBtn = document.getElementById('download-md-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const shared = window.VibeformShared;

  let templateFilename = '';
  let templateMarkdown = '';

  function setStatus(message, isError = false) {
    previewStatus.textContent = message;
    previewStatus.classList.toggle('is-error', isError);
  }

  function setDownloadEnabled(enabled) {
    downloadMdBtn.disabled = !enabled;
    downloadPdfBtn.disabled = !enabled || !shared.resolvePdfExporter();
  }

  function getFilenameFromPath() {
    const prefix = '/view/';
    const pathname = window.location.pathname;

    if (!pathname.startsWith(prefix)) {
      return '';
    }

    return decodeURIComponent(pathname.slice(prefix.length));
  }

  async function loadTemplate(filename) {
    const response = await fetch(`/templates/${encodeURIComponent(filename)}`);
    if (!response.ok) {
      throw new Error(`Unable to load template: ${filename}`);
    }

    return response.text();
  }

  async function start() {
    templateFilename = getFilenameFromPath();
    if (!templateFilename) {
      throw new Error('No template selected.');
    }

    const catalogResponse = await fetch('/api/catalog');
    if (!catalogResponse.ok) {
      throw new Error('Unable to load template metadata.');
    }

    const catalog = await catalogResponse.json();
    const entry = (catalog.templates || []).find((item) => item.filename === templateFilename);
    if (!entry) {
      throw new Error(`Unknown template: ${templateFilename}`);
    }

    titleEl.textContent = entry.name;
    descriptionEl.textContent = entry.description;
    document.title = `Vibeform — ${entry.name}`;

    templateMarkdown = await loadTemplate(templateFilename);
    if (!templateMarkdown.trim()) {
      throw new Error('Template file is empty.');
    }

    preview.innerHTML = shared.renderMarkdownToHtml(templateMarkdown);
    setStatus('Preview ready');
    setDownloadEnabled(true);

    downloadMdBtn.addEventListener('click', () => {
      shared.downloadMarkdownFile(
        templateMarkdown,
        shared.buildTemplateDownloadName(templateFilename, 'md'),
      );
      setStatus('Markdown downloaded');
    });

    downloadPdfBtn.addEventListener('click', async () => {
      try {
        setStatus('Generating PDF…');
        setDownloadEnabled(false);
        await shared.downloadPdfFromPreview(
          preview,
          shared.buildTemplateDownloadName(templateFilename, 'pdf'),
        );
        setStatus('PDF downloaded');
      } catch (error) {
        setStatus(error.message, true);
      } finally {
        setDownloadEnabled(Boolean(templateMarkdown));
      }
    });
  }

  start().catch((error) => {
    setStatus(error.message, true);
    preview.innerHTML = `<p class="preview-error">${error.message}</p>`;
    setDownloadEnabled(false);
  });
})();
