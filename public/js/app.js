const { DEFAULT_FORM, renderDocument, buildDownloadFilename, loadTemplates } =
  window.TemplateEngine;

const form = document.getElementById('nda-form');
const preview = document.getElementById('preview');
const previewStatus = document.getElementById('preview-status');
const downloadBtn = document.getElementById('download-btn');

let coverTemplate = '';
let termsTemplate = '';
let latestMarkdown = '';

function setStatus(message, isError = false) {
  previewStatus.textContent = message;
  previewStatus.classList.toggle('is-error', isError);
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

function readFormData() {
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

function populateForm(defaults) {
  setFieldValue('purpose', defaults.purpose);
  setFieldValue('effectiveDate', defaults.effectiveDate);
  setFieldValue('mndaTermYears', defaults.mndaTermYears);
  setFieldValue('confidentialityYears', defaults.confidentialityYears);
  setFieldValue('governingLaw', defaults.governingLaw);
  setFieldValue('jurisdiction', defaults.jurisdiction);
  setFieldValue('modifications', defaults.modifications);
  setRadioValue('mndaTermType', defaults.mndaTermType);
  setRadioValue('confidentialityType', defaults.confidentialityType);
}

function renderMarkdownToHtml(markdown) {
  if (typeof marked === 'undefined' || typeof marked.parse !== 'function') {
    throw new Error(
      'Markdown preview library failed to load. Start the app with `npm start` and refresh.',
    );
  }

  return marked.parse(markdown, { async: false });
}

function updatePreview() {
  if (!coverTemplate || !termsTemplate) {
    return;
  }

  try {
    const formData = readFormData();
    latestMarkdown = renderDocument(coverTemplate, termsTemplate, formData);

    if (!latestMarkdown.trim()) {
      throw new Error('Generated document is empty.');
    }

    preview.innerHTML = renderMarkdownToHtml(latestMarkdown);
    setStatus('Preview updated');
    downloadBtn.disabled = false;
  } catch (error) {
    latestMarkdown = '';
    downloadBtn.disabled = true;
    setStatus(`Preview error: ${error.message}`, true);
    preview.innerHTML = `<p class="preview-error">${error.message}</p>`;
  }
}

function downloadDocument() {
  if (!latestMarkdown) {
    return;
  }

  const formData = readFormData();
  const blob = new Blob([latestMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildDownloadFilename(formData);
  link.click();
  URL.revokeObjectURL(url);
}

async function init() {
  if (!form || !preview || !downloadBtn) {
    throw new Error('Application markup is missing required elements.');
  }

  populateForm(DEFAULT_FORM);

  try {
    const templates = await loadTemplates();
    coverTemplate = templates.coverTemplate;
    termsTemplate = templates.termsTemplate;
    setStatus('Ready');
    updatePreview();
  } catch (error) {
    setStatus('Failed to load templates.', true);
    preview.innerHTML = `<p class="preview-error">${error.message}</p>`;
  }

  form.addEventListener('input', updatePreview);
  downloadBtn.addEventListener('click', downloadDocument);
}

init().catch((error) => {
  setStatus('Application failed to start.', true);
  preview.innerHTML = `<p class="preview-error">${error.message}</p>`;
});
