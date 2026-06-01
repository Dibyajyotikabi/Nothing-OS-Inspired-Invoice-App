const STORAGE_KEY = 'dot-matrix-invoice-state-v1';
const MAX_LOGO_BYTES = 750 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const DEFAULT_INVOICE = {
  studio: {
    companyName: 'Arvo Studio',
    tagline: 'DESIGN STUDIO',
    brandMode: 'text',
    logoDataUrl: '',
    logoFileName: '',
    email: 'hello@arvostudio.com',
    phone: '(415) 555-0198',
    website: 'www.arvostudio.com',
    address: '123 Design Street\nSan Francisco, CA 94103'
  },
  invoice: {
    number: 'INV-24.001',
    issueDate: 'May 26, 2024',
    dueDate: 'June 9, 2024',
    status: 'PAID'
  },
  client: {
    name: 'Acme Corporation',
    address: '456 Market Street, Suite 800\nSan Francisco, CA 94105\nUnited States'
  },
  items: [
    { id: crypto.randomUUID(), description: 'Brand Identity Design', quantity: 1, unitPrice: 2500 },
    { id: crypto.randomUUID(), description: 'Web Design', quantity: 1, unitPrice: 3500 },
    { id: crypto.randomUUID(), description: 'UI/UX Design', quantity: 1, unitPrice: 2000 },
    { id: crypto.randomUUID(), description: 'Print Design', quantity: 1, unitPrice: 750 }
  ],
  notes: 'Thank you for your business!',
  payment: {
    bank: 'Bank of America',
    accountName: 'Arvo Design Studio',
    accountNumber: '1234 5678 9012',
    routingNumber: '026009593'
  },
  taxRate: 8.5
};

const invoiceDocument = document.querySelector('#invoiceDocument');
const toolbarInvoiceNumber = document.querySelector('#toolbarInvoiceNumber');
const brandModeControl = document.querySelector('#brandModeControl');
const companyNameControl = document.querySelector('#companyNameControl');
const logoUploadControl = document.querySelector('#logoUploadControl');
const removeLogoButton = document.querySelector('#removeLogoButton');
const statusControl = document.querySelector('#statusControl');
const taxControl = document.querySelector('#taxControl');
const addItemButton = document.querySelector('#addItemButton');
const printButton = document.querySelector('#printButton');
const resetButton = document.querySelector('#resetButton');

let state = loadState();

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!savedState) {
      return structuredClone(DEFAULT_INVOICE);
    }
    return {
      ...structuredClone(DEFAULT_INVOICE),
      ...savedState,
      studio: { ...DEFAULT_INVOICE.studio, ...savedState.studio },
      invoice: { ...DEFAULT_INVOICE.invoice, ...savedState.invoice },
      client: { ...DEFAULT_INVOICE.client, ...savedState.client },
      payment: { ...DEFAULT_INVOICE.payment, ...savedState.payment },
      items: Array.isArray(savedState.items) && savedState.items.length ? savedState.items : structuredClone(DEFAULT_INVOICE.items)
    };
  } catch (error) {
    console.error('Unable to load invoice state:', error);
    return structuredClone(DEFAULT_INVOICE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function multiline(value) {
  return escapeHtml(value).replaceAll('\n', '<br>');
}

function formatCurrency(value, compact = false) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
  return compact ? formatted.replace('$', '$ ') : formatted;
}

function parseMoney(value) {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTotals() {
  const subtotal = state.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const tax = subtotal * (Number(state.taxRate || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

function setPath(path, value) {
  const keys = path.split('.');
  let current = state;
  keys.slice(0, -1).forEach((key) => {
    current = current[key];
  });
  current[keys.at(-1)] = value;
}

const DOT_FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['10010', '10010', '10010', '11111', '00010', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110']
};

function normalizeBrandText(value) {
  const cleanText = String(value || DEFAULT_INVOICE.studio.companyName)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleanText || DEFAULT_INVOICE.studio.companyName.toUpperCase();
}

function dotLetterMarkup(character) {
  if (character === ' ') {
    return '<span class="dot-letter dot-space" aria-hidden="true"></span>';
  }

  const glyph = DOT_FONT[character] || DOT_FONT.A;
  const dots = glyph.flatMap((row) => {
    return [...row].map((value) => `<i class="${value === '1' ? 'on' : 'off'}"></i>`);
  });
  return `<span class="dot-letter">${dots.join('')}</span>`;
}

function dotMatrixMarkup(value) {
  return [...normalizeBrandText(value)].map(dotLetterMarkup).join('');
}

function spacedText(text) {
  return [...text].map((char) => `<span>${escapeHtml(char)}</span>`).join('');
}

function icon(name) {
  const icons = {
    map: '<path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" />',
    mail: '<path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" />',
    phone: '<path d="M7 4h3l1.2 4-2 1.2a12 12 0 0 0 5.6 5.6l1.2-2 4 1.2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 5 6.2 2 2 0 0 1 7 4z" />',
    globe: '<circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6" />'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] ?? ''}</svg>`;
}

function contactRow(iconName, path, value) {
  return `
    <div class="contact-row">
      <div class="contact-icon">${icon(iconName)}</div>
      <div class="editable multiline" contenteditable="true" data-path="${path}">${multiline(value)}</div>
    </div>
  `;
}

function metaRow(label, path, value, extraClass = '') {
  return `
    <div class="meta-row ${extraClass}">
      <dt class="tiny-label">${spacedText(label)}</dt>
      <dd class="editable" contenteditable="true" data-path="${path}">${escapeHtml(value)}</dd>
    </div>
  `;
}

function isSafeLogoDataUrl(value) {
  return /^data:image\/(png|jpeg|webp|gif);base64,/i.test(String(value || ''));
}

function getBrandMarkup() {
  const companyName = state.studio.companyName || DEFAULT_INVOICE.studio.companyName;
  if (state.studio.brandMode === 'logo' && isSafeLogoDataUrl(state.studio.logoDataUrl)) {
    return `
      <img class="brand-logo-image" src="${state.studio.logoDataUrl}" alt="${escapeHtml(companyName)} logo" />
    `;
  }

  return `
    <div class="dot-logo" id="dotLogo" aria-label="${escapeHtml(companyName)}">${dotMatrixMarkup(companyName)}</div>
  `;
}

function renderItemRows() {
  return state.items.map((item) => {
    const amount = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    return `
      <div class="item-row" data-item-id="${item.id}">
        <button class="row-action" type="button" data-remove-item="${item.id}" title="Remove item" aria-label="Remove ${escapeHtml(item.description)}">
          <span>+</span>
        </button>
        <div class="item-description editable" contenteditable="true" data-item-field="description">${escapeHtml(item.description)}</div>
        <div class="item-quantity editable number" contenteditable="true" inputmode="decimal" data-item-field="quantity">${escapeHtml(item.quantity)}</div>
        <div class="item-price editable money" contenteditable="true" inputmode="decimal" data-item-field="unitPrice">${formatCurrency(item.unitPrice)}</div>
        <div class="item-amount money" data-item-amount>${formatCurrency(amount)}</div>
      </div>
    `;
  }).join('');
}

function renderInvoice() {
  const totals = getTotals();

  invoiceDocument.innerHTML = `
    <div class="invoice-dot-field invoice-dot-field-top"></div>
    <div class="invoice-dot-field invoice-dot-field-bottom"></div>
    <div class="red-dot"></div>
    <div class="decor-plus decor-plus-top">+</div>
    <div class="decor-plus decor-plus-bottom">+</div>

    <header class="invoice-header">
      <div class="brand-block">
        <div class="brand-line">
          ${getBrandMarkup()}
        </div>
        <p class="studio-label editable" contenteditable="true" data-path="studio.tagline">${spacedText(state.studio.tagline || DEFAULT_INVOICE.studio.tagline)}</p>
      </div>
      <div class="title-block">
        <h1>${spacedText('INVOICE')}</h1>
        <p class="invoice-code editable" contenteditable="true" data-path="invoice.number">${escapeHtml(state.invoice.number)}</p>
      </div>
    </header>

    <section class="summary-grid">
      <div class="contact-list">
        ${contactRow('map', 'studio.address', state.studio.address)}
        ${contactRow('mail', 'studio.email', state.studio.email)}
        ${contactRow('phone', 'studio.phone', state.studio.phone)}
        ${contactRow('globe', 'studio.website', state.studio.website)}
      </div>
      <div class="summary-divider" aria-hidden="true"></div>
      <dl class="meta-table">
        ${metaRow('INVOICE NO.', 'invoice.number', state.invoice.number)}
        ${metaRow('ISSUE DATE', 'invoice.issueDate', state.invoice.issueDate)}
        ${metaRow('DUE DATE', 'invoice.dueDate', state.invoice.dueDate)}
        <div class="meta-row status-row">
          <dt class="tiny-label">${spacedText('STATUS')}</dt>
          <dd class="status-value" data-status-value>
            <span class="status-dot"></span>
            <span>${escapeHtml(state.invoice.status)}</span>
          </dd>
        </div>
      </dl>
    </section>

    <section class="client-section">
      <p class="section-label bracket-label">${spacedText('CLIENT')}</p>
      <h2 class="editable" contenteditable="true" data-path="client.name">${escapeHtml(state.client.name)}</h2>
      <div class="client-address editable multiline" contenteditable="true" data-path="client.address">${multiline(state.client.address)}</div>
    </section>

    <section class="items-section" aria-label="Invoice line items">
      <div class="item-head">
        <div></div>
        <div class="tiny-label">${spacedText('DESCRIPTION')}</div>
        <div class="tiny-label align-center">${spacedText('QTY')}</div>
        <div class="tiny-label align-right">${spacedText('UNIT PRICE')}</div>
        <div class="tiny-label align-right">${spacedText('AMOUNT')}</div>
      </div>
      <div class="item-body" id="itemBody">
        ${renderItemRows()}
      </div>
    </section>

    <section class="invoice-footer">
      <div class="footer-left">
        <div class="notes-block">
          <p class="tiny-label">${spacedText('NOTES')}</p>
          <div class="editable multiline" contenteditable="true" data-path="notes">${multiline(state.notes)}</div>
        </div>
        <div class="payment-block">
          <p class="section-label bracket-label">${spacedText('PAYMENT INFORMATION')}</p>
          <div class="payment-lines">
            <strong class="editable" contenteditable="true" data-path="payment.bank">${escapeHtml(state.payment.bank)}</strong>
            <span>Account Name: <span class="editable" contenteditable="true" data-path="payment.accountName">${escapeHtml(state.payment.accountName)}</span></span>
            <span>Account No: <span class="editable" contenteditable="true" data-path="payment.accountNumber">${escapeHtml(state.payment.accountNumber)}</span></span>
            <span>Routing No: <span class="editable" contenteditable="true" data-path="payment.routingNumber">${escapeHtml(state.payment.routingNumber)}</span></span>
          </div>
        </div>
      </div>
      <aside class="totals-panel">
        <div class="total-line">
          <span class="tiny-label">${spacedText('SUBTOTAL')}</span>
          <strong data-subtotal>${formatCurrency(totals.subtotal)}</strong>
        </div>
        <div class="total-line">
          <span class="tiny-label">${spacedText(`TAX (${Number(state.taxRate || 0).toFixed(1)}%)`)}</span>
          <strong data-tax>${formatCurrency(totals.tax)}</strong>
        </div>
        <div class="dash-line"></div>
        <p class="tiny-label">${spacedText('TOTAL')}</p>
        <strong class="grand-total" data-total>${formatCurrency(totals.total, true)}</strong>
        <div class="barcode" aria-hidden="true"></div>
        <div class="payment-note">
          <span class="circle-arrow">${icon('arrow')}</span>
          <p>Please make payment within <strong>14 days</strong> of the invoice date.</p>
        </div>
      </aside>
    </section>
  `;

  updateToolbar();
}

function updateToolbar() {
  toolbarInvoiceNumber.textContent = state.invoice.number;
  brandModeControl.value = state.studio.brandMode || 'text';
  companyNameControl.value = state.studio.companyName || DEFAULT_INVOICE.studio.companyName;
  removeLogoButton.hidden = !isSafeLogoDataUrl(state.studio.logoDataUrl);
  statusControl.value = state.invoice.status;
  taxControl.value = Number(state.taxRate || 0).toFixed(1);
}

function updateTotals() {
  document.querySelectorAll('.item-row').forEach((row) => {
    const item = state.items.find((entry) => entry.id === row.dataset.itemId);
    if (!item) return;
    const amount = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    row.querySelector('[data-item-amount]').textContent = formatCurrency(amount);
  });

  const totals = getTotals();
  document.querySelector('[data-subtotal]').textContent = formatCurrency(totals.subtotal);
  document.querySelector('[data-tax]').textContent = formatCurrency(totals.tax);
  document.querySelector('[data-total]').textContent = formatCurrency(totals.total, true);
  const taxLabel = document.querySelector('.totals-panel .total-line:nth-child(2) .tiny-label');
  taxLabel.innerHTML = spacedText(`TAX (${Number(state.taxRate || 0).toFixed(1)}%)`);
}

function getPrintFitScript() {
  return `
      function fitInvoiceForPrint() {
        const invoice = document.querySelector('#invoiceDocument');
        if (!invoice) return;

        const a4WidthPx = 210 / 25.4 * 96;
        const a4HeightPx = 297 / 25.4 * 96;
        const scale = Math.min(a4WidthPx / invoice.offsetWidth, a4HeightPx / invoice.scrollHeight, 1);
        const marginX = Math.max((a4WidthPx - invoice.offsetWidth * scale) / 2, 0);

        document.documentElement.style.setProperty('--print-scale', scale.toFixed(4));
        document.documentElement.style.setProperty('--print-margin-x', marginX.toFixed(2) + 'px');
      }`;
}

function getPrintDocumentHtml() {
  const stylesheetUrl = new URL('src/styles.css', window.location.href).href;
  const invoiceNumber = state.invoice.number.replace(/[^a-z0-9.-]+/gi, '-');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${escapeHtml(invoiceNumber)}</title>
    <link rel="icon" href="data:," />
    <link rel="stylesheet" href="${stylesheetUrl}" />
  </head>
  <body class="print-window">
    <main class="print-page">
      ${invoiceDocument.outerHTML}
    </main>
    <script>
${getPrintFitScript()}
      window.addEventListener('load', () => {
        fitInvoiceForPrint();
        requestAnimationFrame(() => {
          window.focus();
          window.print();
        });
      });
    <\/script>
  </body>
</html>`;
}

function printInvoice() {
  saveState();
  document.activeElement?.blur();

  const printHtml = getPrintDocumentHtml();
  const printWindow = window.open('', 'invoice-print-preview');

  if (!printWindow) {
    const fitScript = document.createElement('script');
    fitScript.textContent = `${getPrintFitScript()}; fitInvoiceForPrint();`;
    document.body.append(fitScript);
    window.focus();
    window.print();
    fitScript.remove();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
  printWindow.focus();
}

function validateLogoFile(file) {
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

  if (!ALLOWED_LOGO_TYPES.has(file.type) || !allowedExtensions.has(extension)) {
    throw new Error('Please upload a PNG, JPG, WebP, or GIF logo.');
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('Please choose a logo smaller than 750 KB.');
  }
}

function readLogoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error('Logo could not be read.')));
    reader.readAsDataURL(file);
  });
}

invoiceDocument.addEventListener('input', (event) => {
  const editable = event.target.closest('.editable');
  if (!editable) return;

  if (editable.dataset.path) {
    setPath(editable.dataset.path, editable.innerText.trim());
    if (editable.dataset.path === 'invoice.number') {
      document.querySelectorAll('[data-path="invoice.number"]').forEach((node) => {
        if (node !== editable) node.textContent = state.invoice.number;
      });
      toolbarInvoiceNumber.textContent = state.invoice.number;
    }
  }

  if (editable.dataset.itemField) {
    const row = editable.closest('.item-row');
    const item = state.items.find((entry) => entry.id === row.dataset.itemId);
    if (!item) return;

    if (editable.dataset.itemField === 'description') {
      item.description = editable.innerText.trim();
    }
    if (editable.dataset.itemField === 'quantity') {
      item.quantity = parseMoney(editable.innerText);
    }
    if (editable.dataset.itemField === 'unitPrice') {
      item.unitPrice = parseMoney(editable.innerText);
    }
  }

  updateTotals();
  saveState();
});

invoiceDocument.addEventListener('blur', (event) => {
  const editable = event.target.closest('.editable');
  if (!editable) return;

  if (editable.dataset.itemField === 'unitPrice') {
    const row = editable.closest('.item-row');
    const item = state.items.find((entry) => entry.id === row.dataset.itemId);
    editable.textContent = formatCurrency(item?.unitPrice ?? 0);
  }
  if (editable.dataset.itemField === 'quantity') {
    const row = editable.closest('.item-row');
    const item = state.items.find((entry) => entry.id === row.dataset.itemId);
    editable.textContent = item?.quantity ?? 0;
  }
}, true);

invoiceDocument.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-item]');
  if (!removeButton) return;

  if (state.items.length === 1) {
    state.items[0] = { id: crypto.randomUUID(), description: 'New Service', quantity: 1, unitPrice: 0 };
  } else {
    state.items = state.items.filter((item) => item.id !== removeButton.dataset.removeItem);
  }

  saveState();
  renderInvoice();
});

brandModeControl.addEventListener('change', () => {
  state.studio.brandMode = brandModeControl.value;
  saveState();
  renderInvoice();
});

companyNameControl.addEventListener('input', () => {
  state.studio.companyName = companyNameControl.value.trim() || DEFAULT_INVOICE.studio.companyName;
  saveState();
  renderInvoice();
});

logoUploadControl.addEventListener('change', async () => {
  const file = logoUploadControl.files?.[0];
  if (!file) return;

  try {
    validateLogoFile(file);
    const logoDataUrl = await readLogoFile(file);
    if (!isSafeLogoDataUrl(logoDataUrl)) {
      throw new Error('Logo format is not supported.');
    }

    state.studio.logoDataUrl = logoDataUrl;
    state.studio.logoFileName = file.name;
    state.studio.brandMode = 'logo';
    saveState();
    renderInvoice();
  } catch (error) {
    alert(error.message);
  } finally {
    logoUploadControl.value = '';
  }
});

removeLogoButton.addEventListener('click', () => {
  state.studio.logoDataUrl = '';
  state.studio.logoFileName = '';
  state.studio.brandMode = 'text';
  saveState();
  renderInvoice();
});

statusControl.addEventListener('change', () => {
  state.invoice.status = statusControl.value;
  saveState();
  document.querySelector('[data-status-value] span:last-child').textContent = state.invoice.status;
});

taxControl.addEventListener('input', () => {
  state.taxRate = Number(taxControl.value || 0);
  updateTotals();
  saveState();
});

addItemButton.addEventListener('click', () => {
  state.items.push({
    id: crypto.randomUUID(),
    description: 'New Service',
    quantity: 1,
    unitPrice: 0
  });
  saveState();
  renderInvoice();
});

printButton.addEventListener('click', printInvoice);

resetButton.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(DEFAULT_INVOICE);
  renderInvoice();
});

renderInvoice();
