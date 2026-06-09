# Vibeform

![Status](https://img.shields.io/badge/status-in%20progress-yellow)

A legal document creator prototype for the Prelegal project — starting with a Mutual NDA builder.

## About

Vibeform helps users generate legal documents from curated Common Paper templates. The first prototype (KAN-4) is a web app where users fill in cover page details, preview the completed Mutual NDA, and download it as Markdown.

## Project status

| Item | Status |
|------|--------|
| Project | **In progress** |
| Template dataset (KAN-2) | Done |
| Mutual NDA creator prototype (KAN-4) | In review |
| Deployment | Not configured |

## Features

- Form-driven cover page input (purpose, dates, terms, governing law, parties)
- Live preview of the filled Mutual NDA (cover page + standard terms)
- Download completed document as a local `.md` file

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify template rendering

```bash
npm test
```

This runs automated checks for:

- Template placeholder substitution (including Windows CRLF templates)
- Markdown-to-HTML preview rendering
- Express routes for UI, templates, and local `marked` bundle
- `catalog.json` integrity and license notice

## Project structure

```
templates/          Common Paper markdown templates (from KAN-2)
catalog.json        Template metadata catalog
public/             Web UI (form, preview, download)
server.js           Express static file server
scripts/            Utility scripts
```

## Roadmap

- [x] Curate CommonPaper legal templates (KAN-2)
- [x] Prototype Mutual NDA creator (KAN-4)
- [ ] Add PDF export
- [ ] Support additional agreement types from catalog
- [ ] Add tests and deployment workflow

## Contributing

Contributions are welcome while the project is in progress. Please open an issue before large changes so we can align on direction.

## Links

- [Repository](https://github.com/Aryan4807/Vibeform)
- [Issues](https://github.com/Aryan4807/Vibeform/issues)
- [KAN-4 — Mutual NDA prototype](https://agg4807.atlassian.net/browse/KAN-4)

## License

Template content in `templates/` is sourced from [Common Paper](https://github.com/CommonPaper) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Application code license TBD.
