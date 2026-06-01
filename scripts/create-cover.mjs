import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetDir = join(root, 'assets');
const outputPath = join(assetDir, 'github-cover.png');
const width = 1280;
const height = 640;

const browserCandidates = [
  undefined,
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
];

async function launchBrowser() {
  let lastError;

  for (const executablePath of browserCandidates) {
    if (executablePath && !existsSync(executablePath)) continue;

    try {
      return await chromium.launch({
        executablePath,
        headless: true
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function buildCoverHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --ink: #080808;
        --paper: #fbfbfa;
        --line: #d7d7d2;
        --muted: #686868;
        --accent: #ff1414;
        --field: #ececea;
      }

      * {
        box-sizing: border-box;
      }

      body {
        width: ${width}px;
        height: ${height}px;
        margin: 0;
        overflow: hidden;
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(#d8d8d3 1px, transparent 1.5px) 58px 56px / 22px 22px,
          linear-gradient(135deg, #f7f7f4 0%, #ededeb 54%, #fdfdfc 100%);
      }

      .cover {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 58px 70px;
      }

      .red-dot {
        position: absolute;
        top: 92px;
        left: 62px;
        width: 16px;
        height: 16px;
        border-radius: 999px;
        background: var(--accent);
        box-shadow: 0 0 0 8px rgb(255 20 20 / 8%);
      }

      .plus {
        position: absolute;
        color: #151515;
        font-size: 32px;
        font-weight: 300;
        line-height: 1;
      }

      .plus.one {
        top: 42px;
        right: 70px;
      }

      .plus.two {
        bottom: 52px;
        left: 62px;
      }

      .copy {
        position: relative;
        z-index: 2;
        width: 520px;
        padding-top: 26px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 58px;
      }

      .dot-word {
        display: flex;
        gap: 6px;
      }

      .dot-letter {
        display: grid;
        grid-template-columns: repeat(5, 6px);
        grid-auto-rows: 6px;
        gap: 2px;
      }

      .dot-letter i {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #000;
      }

      .dot-letter i.off {
        opacity: 0;
      }

      .registered {
        align-self: flex-start;
        margin-top: 2px;
        font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
        font-size: 15px;
      }

      h1 {
        margin: 0;
        font-size: 76px;
        font-weight: 300;
        line-height: 0.96;
        letter-spacing: 0;
      }

      .mono {
        margin: 22px 0 0;
        font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .summary {
        width: 425px;
        margin: 26px 0 0;
        color: #2a2a2a;
        font-size: 22px;
        line-height: 1.35;
      }

      .pills {
        display: flex;
        gap: 10px;
        margin-top: 34px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 0 14px;
        border: 1px solid #c9c9c4;
        border-radius: 999px;
        background: rgb(255 255 255 / 72%);
        font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .stage {
        position: absolute;
        top: 42px;
        right: 76px;
        width: 575px;
        height: 552px;
        border: 1px solid rgb(0 0 0 / 6%);
        background: rgb(255 255 255 / 54%);
        box-shadow: 0 34px 70px rgb(0 0 0 / 14%);
        transform: rotate(-2.5deg);
      }

      .invoice {
        position: absolute;
        top: 36px;
        right: 38px;
        width: 508px;
        height: 490px;
        overflow: hidden;
        padding: 38px 42px;
        background: var(--paper);
        box-shadow: 0 26px 56px rgb(0 0 0 / 13%);
        transform: rotate(2.5deg);
      }

      .invoice::before,
      .invoice::after {
        content: "";
        position: absolute;
        width: 250px;
        height: 140px;
        pointer-events: none;
        opacity: 0.5;
        background-image: radial-gradient(#cfcfca 1px, transparent 1.4px);
        background-size: 15px 15px;
      }

      .invoice::before {
        top: 0;
        left: 28px;
      }

      .invoice::after {
        bottom: 48px;
        left: 30px;
      }

      .invoice-head {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 26px;
        align-items: start;
      }

      .mini-logo {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .mini-logo .dot-letter {
        grid-template-columns: repeat(5, 3px);
        grid-auto-rows: 3px;
        gap: 1px;
      }

      .mini-logo .dot-letter i {
        width: 3px;
        height: 3px;
      }

      .invoice-title {
        display: flex;
        justify-content: flex-end;
        gap: 11px;
        margin-top: 8px;
        font-size: 28px;
        font-weight: 300;
      }

      .meta {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 62px;
      }

      .contact,
      .details {
        display: grid;
        gap: 11px;
      }

      .line {
        height: 1px;
        background: var(--line);
      }

      .small {
        color: var(--muted);
        font-size: 10px;
      }

      .client {
        position: relative;
        z-index: 1;
        margin-top: 36px;
      }

      .label {
        font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .client strong {
        display: block;
        margin-top: 9px;
        font-size: 20px;
        font-weight: 400;
      }

      .items {
        position: relative;
        z-index: 1;
        margin-top: 30px;
        border-top: 1px solid var(--line);
      }

      .item {
        display: grid;
        grid-template-columns: 1fr 64px 82px;
        gap: 16px;
        align-items: center;
        min-height: 38px;
        border-bottom: 1px solid var(--line);
        font-size: 10px;
      }

      .item strong {
        font-size: 12px;
      }

      .total {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        align-items: end;
        margin-top: 28px;
      }

      .amount {
        font-size: 42px;
        font-weight: 300;
        line-height: 1;
      }

      .barcode {
        width: 132px;
        height: 16px;
        margin-top: 11px;
        background: repeating-linear-gradient(to right, #000 0 2px, transparent 2px 4px, #000 4px 5px, transparent 5px 8px);
      }
    </style>
  </head>
  <body>
    <main class="cover">
      <div class="red-dot"></div>
      <div class="plus one">+</div>
      <div class="plus two">+</div>
      <section class="copy">
        <div class="brand">
          <div class="dot-word">${dotWord('NOTHING')}</div>
          <span class="registered">&reg;</span>
        </div>
        <h1>Invoice App</h1>
        <p class="mono">Nothing OS inspired billing</p>
        <p class="summary">A sharp editable invoice with live totals, extension-ready files, and print output that keeps the design intact.</p>
        <div class="pills">
          <span class="pill">Editable</span>
          <span class="pill">Print Ready</span>
          <span class="pill">Extension</span>
        </div>
      </section>
      <section class="stage" aria-hidden="true">
        <article class="invoice">
          <header class="invoice-head">
            <div>
              <div class="mini-logo">${dotWord('NOTHING')}</div>
              <p class="label" style="margin-top: 10px;">Design Studio</p>
            </div>
            <div>
              <div class="invoice-title">${spacedText('INVOICE')}</div>
              <p class="small" style="text-align: right;">INV-24.001</p>
            </div>
          </header>
          <section class="meta">
            <div class="contact">
              <span>123 Design Street</span>
              <div class="line"></div>
              <span>hello@arvostudio.com</span>
              <div class="line"></div>
              <span>www.arvostudio.com</span>
              <div class="line"></div>
            </div>
            <div class="details">
              <span><strong>Invoice No.</strong> INV-24.001</span>
              <div class="line"></div>
              <span><strong>Issue Date</strong> May 26, 2024</span>
              <div class="line"></div>
              <span><strong>Status</strong> Paid</span>
              <div class="line"></div>
            </div>
          </section>
          <section class="client">
            <span class="label">Client</span>
            <strong>Acme Corporation</strong>
            <p class="small">456 Market Street, San Francisco</p>
          </section>
          <section class="items">
            <div class="item"><strong>Brand Identity Design</strong><span>1</span><span>$2,500</span></div>
            <div class="item"><strong>Web Design</strong><span>1</span><span>$3,500</span></div>
            <div class="item"><strong>UI/UX Design</strong><span>1</span><span>$2,000</span></div>
          </section>
          <section class="total">
            <div>
              <span class="label">Total</span>
              <div class="barcode"></div>
            </div>
            <strong class="amount">$9,493.75</strong>
          </section>
        </article>
      </section>
    </main>
  </body>
</html>`;
}

function dotWord(word) {
  const letters = {
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110']
  };

  return [...word].map((letter) => {
    const dots = letters[letter].flatMap((row) => {
      return [...row].map((value) => `<i class="${value === '1' ? '' : 'off'}"></i>`);
    });
    return `<span class="dot-letter">${dots.join('')}</span>`;
  }).join('');
}

function spacedText(text) {
  return [...text].map((letter) => `<span>${letter}</span>`).join('');
}

await mkdir(assetDir, { recursive: true });

const browser = await launchBrowser();
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 2
});

await page.setContent(buildCoverHtml(), { waitUntil: 'load' });
await page.screenshot({
  path: outputPath,
  type: 'png'
});
await browser.close();

console.log(`Created ${outputPath}`);
