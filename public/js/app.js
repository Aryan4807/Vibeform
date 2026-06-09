const { DEFAULT_FORM, renderDocument, buildDownloadFilename, loadTemplates } =
  window.TemplateEngine;

const form = document.getElementById('nda-form');
const preview = document.getElementById('preview');
const previewStatus = document.getElementById('preview-status');
const downloadBtn = document.getElementById('download-btn');

let coverTemplate = '';
let termsTemplate = '';
let latestMarkdown = '';

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
  form.purpose.value = defaults.purpose;
  form.effectiveDate.value = defaults.effectiveDate;
  form.mndaTermYears.value = defaults.mndaTermYears;
  form.confidentialityYears.value = defaults.confidentialityYears;
  form.governingLaw.value = defaults.governingLaw;
  form.jurisdiction.value = defaults.jurisdiction;
  form.modifications.value = defaults.modifications;

  form.querySelector(
    `input[name="mndaTermType"][value="${defaults.mndaTermType}"]`,
  ).checked = true;
  form.querySelector(
    `input[name="confidentialityType"][value="${defaults.confidentialityType}"]`,
  ).checked = true;
}

function updatePreview() {
  if (!coverTemplate || !termsTemplate) {
    return;
  }

  const formData = readFormData();
  latestMarkdown = renderDocument(coverTemplate, termsTemplate, formData);
  preview.innerHTML = marked.parse(latestMarkdown);
  previewStatus.textContent = 'Preview updated';
  downloadBtn.disabled = false;
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
  populateForm(DEFAULT_FORM);

  try {
    const templates = await loadTemplates();
    coverTemplate = templates.coverTemplate;
    termsTemplate = templates.termsTemplate;
    previewStatus.textContent = 'Ready';
    updatePreview();
  } catch (error) {
    previewStatus.textContent = 'Failed to load templates.';
    preview.innerHTML = `<p>${error.message}</p>`;
  }

  form.addEventListener('input', updatePreview);
  downloadBtn.addEventListener('click', downloadDocument);
}

init();
