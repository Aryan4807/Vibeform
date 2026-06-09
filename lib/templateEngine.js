const COVER_PAGE_PATH = '/templates/Mutual-NDA-coverpage.md';
const STANDARD_TERMS_PATH = '/templates/Mutual-NDA.md';

const DEFAULT_FORM = {
  purpose: 'Evaluating whether to enter into a business relationship with the other party.',
  effectiveDate: new Date().toISOString().slice(0, 10),
  mndaTermType: 'expires',
  mndaTermYears: 1,
  confidentialityType: 'fixed',
  confidentialityYears: 1,
  governingLaw: 'Delaware',
  jurisdiction: 'courts located in New Castle, DE',
  modifications: '',
  party1: {
    name: '',
    title: '',
    company: '',
    noticeAddress: '',
  },
  party2: {
    name: '',
    title: '',
    company: '',
    noticeAddress: '',
  },
};

function normalizeLineEndings(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function escapeMarkdown(value) {
  if (value == null) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDisplayDate(isoDate) {
  if (!isoDate) {
    return '';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function buildMndaTermText(form) {
  if (form.mndaTermType === 'continues') {
    return 'period until terminated in accordance with the terms of the MNDA';
  }

  const years = Number(form.mndaTermYears) || 1;
  return `${years} year(s) from Effective Date`;
}

function buildConfidentialityTermText(form) {
  if (form.confidentialityType === 'perpetuity') {
    return 'in perpetuity';
  }

  const years = Number(form.confidentialityYears) || 1;
  return `${years} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`;
}

function buildMndaTermSection(form) {
  const years = Number(form.mndaTermYears) || 1;
  const expiresChecked = form.mndaTermType === 'expires' ? 'x' : ' ';
  const continuesChecked = form.mndaTermType === 'continues' ? 'x' : ' ';

  return `- [${expiresChecked}]     Expires ${years} year(s) from Effective Date.
- [${continuesChecked}]     Continues until terminated in accordance with the terms of the MNDA.`;
}

function buildConfidentialitySection(form) {
  const years = Number(form.confidentialityYears) || 1;
  const fixedChecked = form.confidentialityType === 'fixed' ? 'x' : ' ';
  const perpetuityChecked = form.confidentialityType === 'perpetuity' ? 'x' : ' ';

  return `- [${fixedChecked}]     ${years} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.
- [${perpetuityChecked}]     In perpetuity.`;
}

function buildPartyTable(form) {
  const p1 = form.party1;
  const p2 = form.party2;

  return `| | PARTY 1 | PARTY 2 |
|:--- | :----: | :----: |
| Signature | | |
| Print Name | ${escapeMarkdown(p1.name)} | ${escapeMarkdown(p2.name)} |
| Title | ${escapeMarkdown(p1.title)} | ${escapeMarkdown(p2.title)} |
| Company | ${escapeMarkdown(p1.company)} | ${escapeMarkdown(p2.company)} |
| Notice Address | ${escapeMarkdown(p1.noticeAddress)} | ${escapeMarkdown(p2.noticeAddress)} |
| Date | | |`;
}

function renderCoverPage(template, form) {
  const purpose = escapeMarkdown(form.purpose);
  const effectiveDate = escapeMarkdown(formatDisplayDate(form.effectiveDate));
  const governingLaw = escapeMarkdown(form.governingLaw);
  const jurisdiction = escapeMarkdown(form.jurisdiction);
  const modifications = escapeMarkdown(form.modifications);
  const normalizedTemplate = normalizeLineEndings(template);

  let output = normalizedTemplate
    .replace(
      '[Evaluating whether to enter into a business relationship with the other party.]',
      purpose,
    )
    .replace('[Today\u2019s date]', effectiveDate)
    .replace("[Today's date]", effectiveDate)
    .replace('[Fill in state]', governingLaw)
    .replace(/\[Fill in city or county and state, i\.e\. .+?\]/, jurisdiction);

  output = output.replace(
    /- \[x\]     Expires \[1 year\(s\)\] from Effective Date\.\n- \[ \]     Continues until terminated in accordance with the terms of the MNDA\./,
    buildMndaTermSection(form),
  );

  output = output.replace(
    /- \[x\]     \[1 year\(s\)\] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws\.\n- \[ \]     In perpetuity\./,
    buildConfidentialitySection(form),
  );

  output = output.replace(
    /### MNDA Modifications\nList any modifications to the MNDA\n/,
    `### MNDA Modifications\nList any modifications to the MNDA\n\n${modifications || 'None.'}\n\n`,
  );

  output = output.replace(
    /\|\| PARTY 1 \| PARTY 2 \|[\s\S]*?\| Date \| \| \|/,
    buildPartyTable(form),
  );

  return output;
}

function renderStandardTerms(template, form) {
  const replacements = {
    Purpose: escapeMarkdown(form.purpose),
    'Effective Date': escapeMarkdown(formatDisplayDate(form.effectiveDate)),
    'MNDA Term': escapeMarkdown(buildMndaTermText(form)),
    'Term of Confidentiality': escapeMarkdown(buildConfidentialityTermText(form)),
    'Governing Law': escapeMarkdown(form.governingLaw),
    Jurisdiction: escapeMarkdown(form.jurisdiction),
  };

  let output = normalizeLineEndings(template);

  Object.entries(replacements).forEach(([label, value]) => {
    const pattern = new RegExp(
      `<span class="coverpage_link">${label}</span>`,
      'g',
    );
    output = output.replace(pattern, value);
  });

  return output;
}

function renderDocument(coverTemplate, termsTemplate, form) {
  const coverPage = renderCoverPage(coverTemplate, form);
  const standardTerms = renderStandardTerms(termsTemplate, form);

  return `${coverPage}\n\n---\n\n${standardTerms}`;
}

function buildDownloadFilename(form) {
  const slug = (value) =>
    String(value || 'party')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'party';

  const date = form.effectiveDate || 'draft';
  return `Mutual-NDA-${slug(form.party1.company)}-${slug(form.party2.company)}-${date}.md`;
}

async function loadTemplates(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch is not available in this environment.');
  }

  const [coverResponse, termsResponse] = await Promise.all([
    fetchImpl(COVER_PAGE_PATH),
    fetchImpl(STANDARD_TERMS_PATH),
  ]);

  if (!coverResponse.ok || !termsResponse.ok) {
    throw new Error('Unable to load NDA templates.');
  }

  const [coverTemplate, termsTemplate] = await Promise.all([
    coverResponse.text(),
    termsResponse.text(),
  ]);

  return { coverTemplate, termsTemplate };
}

const TemplateEngine = {
  COVER_PAGE_PATH,
  STANDARD_TERMS_PATH,
  DEFAULT_FORM,
  normalizeLineEndings,
  escapeMarkdown,
  formatDisplayDate,
  buildMndaTermText,
  buildConfidentialityTermText,
  buildMndaTermSection,
  buildConfidentialitySection,
  buildPartyTable,
  renderCoverPage,
  renderStandardTerms,
  renderDocument,
  buildDownloadFilename,
  loadTemplates,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateEngine;
}

if (typeof window !== 'undefined') {
  window.TemplateEngine = TemplateEngine;
}
