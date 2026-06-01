# Simple Invoice App

Editable invoice page with a clean studio layout, live totals, and print output that keeps the same design.

## Features

- Edit invoice, studio, client, payment, notes, and line item text in place.
- Add or remove line items.
- Update status and tax rate from the toolbar.
- Save changes in local browser storage.
- Print a one-page A4 invoice with the desktop layout preserved.
- Load as a simple browser page or as a Chrome extension from `dist/`.

## Run Locally

```bash
npm install
npm start
```

Then open `http://127.0.0.1:4173`.

You can also open `index.html` directly in a browser.

## Build Extension Files

Root source files are the editable source. Chrome extension files are generated into `dist/`.

```bash
npm run build:ext
```

To test as an extension, load the `dist/` folder as an unpacked extension in Chrome or Brave.

## Project Files

- `index.html`: app shell and toolbar
- `src/main.js`: invoice state, editing, totals, print flow
- `src/styles.css`: screen, mobile, and print styles
- `manifest.json`: extension manifest
- `scripts/build-ext.mjs`: copies root source into `dist/`
