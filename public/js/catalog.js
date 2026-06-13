(function initCatalog() {
  const creatorGrid = document.getElementById('creator-grid');
  const templateGrid = document.getElementById('template-grid');

  function createCard({ title, description, actions }) {
    const card = document.createElement('article');
    card.className = 'catalog-card';

    const heading = document.createElement('h3');
    heading.textContent = title;
    card.appendChild(heading);

    const copy = document.createElement('p');
    copy.className = 'catalog-card-copy';
    copy.textContent = description;
    card.appendChild(copy);

    const actionRow = document.createElement('div');
    actionRow.className = 'catalog-card-actions';
    actions.forEach(({ href, label, primary }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      link.className = primary ? 'primary-btn card-btn' : 'secondary-btn card-btn';
      actionRow.appendChild(link);
    });
    card.appendChild(actionRow);

    return card;
  }

  function renderCreators(creators) {
    creatorGrid.innerHTML = '';

    creators.forEach((creator) => {
      creatorGrid.appendChild(
        createCard({
          title: creator.name,
          description: creator.description,
          actions: [{ href: creator.path, label: 'Customize', primary: true }],
        }),
      );
    });
  }

  function renderTemplates(templates) {
    templateGrid.innerHTML = '';

    templates
      .filter((entry) => !entry.filename.toLowerCase().includes('coverpage'))
      .forEach((entry) => {
      templateGrid.appendChild(
        createCard({
          title: entry.name,
          description: entry.description,
          actions: [
            {
              href: `/view/${encodeURIComponent(entry.filename)}`,
              label: 'Preview',
              primary: true,
            },
          ],
        }),
      );
    });
  }

  async function start() {
    const response = await fetch('/api/catalog');
    if (!response.ok) {
      throw new Error('Unable to load template catalog.');
    }

    const catalog = await response.json();
    renderCreators(catalog.creators || []);
    renderTemplates(catalog.templates || []);
  }

  start().catch((error) => {
    creatorGrid.innerHTML = `<p class="preview-error">${error.message}</p>`;
    templateGrid.innerHTML = '';
  });
})();
