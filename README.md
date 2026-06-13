# Vibeform

![Status](https://img.shields.io/badge/status-in%20progress-yellow)

A legal document creator prototype for the Prelegal project — starting with a Mutual NDA builder and expanding across the Common Paper catalog.

## About

Vibeform helps users generate legal documents from curated Common Paper templates. Browse the full catalog, preview any standard agreement, and use the Mutual NDA creator to fill in cover page details, preview the completed agreement, and download it as **PDF** or Markdown.

## Project status

| Item | Status |
|------|--------|
| Project | **In progress** |
| Template dataset (KAN-2) | Done |
| Template download pipeline (KAN-3) | Done |
| Mutual NDA creator prototype (KAN-4) | Done |
| PDF export (KAN-5) | Done |
| Catalog browser & template viewer (KAN-6) | Done |
| CI & deployment workflow (KAN-7) | Done |

## Features

- **Template catalog** — browse all Common Paper agreements from `catalog.json`
- **Template preview** — render and download any standard terms document as PDF or Markdown
- **Mutual NDA creator** — form-driven cover page input with live preview
- **PDF & Markdown export** — client-side downloads for filled NDAs and raw templates

## Getting started

### Prerequisites

- Node.js 18+

### Run locally

```bash
git clone https://github.com/Aryan4807/Vibeform.git
cd Vibeform
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the catalog, [http://localhost:3000/nda](http://localhost:3000/nda) for the Mutual NDA creator.

### Verify template rendering

```bash
npm test
```

This runs automated checks for:

- Template placeholder substitution (including Windows CRLF templates)
- Markdown-to-HTML preview rendering
- Express routes for catalog, NDA creator, template viewer, and vendor bundles
- `catalog.json` integrity, source provenance, and license notice
- Reproducible CommonPaper template download manifest

### Refresh templates

`catalog.json` is the source of truth for template metadata and upstream provenance (`sourceRepo`, `sourcePath`). To re-download all markdown files from Common Paper:

```bash
npm run download-templates
```

This writes 12 templates into `templates/` using the URLs defined in the catalog.

## Deployment

### Docker

```bash
docker build -t vibeform .
docker run --rm -p 3000:3000 vibeform
```

Health check: `GET /health` → `{ "status": "ok" }`

### CI

GitHub Actions runs `npm test` on every push and pull request to `main`, and validates the Docker image build.

## Project structure

```
templates/          Common Paper markdown templates (from KAN-2 / KAN-3)
catalog.json        Template metadata, creators, and download provenance
public/             Web UI (catalog, NDA creator, template viewer)
server.js           Express server and API routes
scripts/            Utility scripts (download-templates.js, sync-vendor.js)
.github/workflows/  CI pipeline
Dockerfile          Production container image
```

## Roadmap

- [x] Curate CommonPaper legal templates (KAN-2)
- [x] Add reproducible template download pipeline (KAN-3)
- [x] Prototype Mutual NDA creator (KAN-4)
- [x] Add PDF export (KAN-5)
- [x] Support additional agreement types from catalog (KAN-6)
- [x] Add tests and deployment workflow (KAN-7)

## Contributing

Contributions are welcome while the project is in progress. Please open an issue before large changes so we can align on direction.

## Links

- [Repository](https://github.com/Aryan4807/Vibeform)
- [Issues](https://github.com/Aryan4807/Vibeform/issues)
- [KAN-5 — PDF export](https://agg4807.atlassian.net/browse/KAN-5)
- [KAN-6 — Catalog browser](https://agg4807.atlassian.net/browse/KAN-6)
- [KAN-7 — CI & deployment](https://agg4807.atlassian.net/browse/KAN-7)

## License

Template content in `templates/` is sourced from [Common Paper](https://github.com/CommonPaper) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Application code license TBD.
