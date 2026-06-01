const STORAGE_KEY = 'dot-matrix-invoice-state-v1';
const MAX_LOGO_BYTES = 750 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const DEFAULT_INVOICE = {
  studio: {
    companyName: 'Your Company',
    tagline: 'COMPANY TAGLINE',
    brandMode: 'text',
    brandFont: 'dot',
    logoDataUrl: '',
    logoFileName: '',
    email: 'hello@yourcompany.com',
    phone: '(415) 555-0198',
    website: 'www.yourcompany.com',
    address: '123 Business Street\nSan Francisco, CA 94103'
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
    accountName: 'Your Company',
    accountNumber: '1234 5678 9012',
    routingNumber: '026009593',
    terms: '14 days'
  },
  currency: 'USD',
  taxPreset: 'custom',
  taxLabel: 'Tax',
  taxRate: 8.5
};

const CURRENCIES = new Map([
  ['USD', { locale: 'en-US' }],
  ['INR', { locale: 'en-IN' }],
  ['EUR', { locale: 'de-DE' }],
  ['GBP', { locale: 'en-GB' }],
  ['AUD', { locale: 'en-AU' }],
  ['CAD', { locale: 'en-CA' }],
  ['SGD', { locale: 'en-SG' }],
  ['AED', { locale: 'en-AE' }],
  ['JPY', { locale: 'ja-JP', fractionDigits: 0 }],
  ['NZD', { locale: 'en-NZ' }],
  ['ZAR', { locale: 'en-ZA' }]
]);

const TAX_PRESETS = new Map([
  ['custom', { label: 'Custom', taxLabel: 'Tax' }],
  ['none', { label: 'No tax', taxLabel: 'No tax', rate: 0 }],
  ['india-gst-5', { label: 'India GST 5%', taxLabel: 'GST India', rate: 5, split: ['CGST', 'SGST'] }],
  ['india-gst-12', { label: 'India GST 12%', taxLabel: 'GST India', rate: 12, split: ['CGST', 'SGST'] }],
  ['india-gst-18', { label: 'India GST 18%', taxLabel: 'GST India', rate: 18, split: ['CGST', 'SGST'] }],
  ['india-gst-28', { label: 'India GST 28%', taxLabel: 'GST India', rate: 28, split: ['CGST', 'SGST'] }],
  ['india-igst-18', { label: 'India IGST 18%', taxLabel: 'IGST India', rate: 18 }],
  ['australia-gst-10', { label: 'Australia GST 10%', taxLabel: 'GST', rate: 10 }],
  ['singapore-gst-9', { label: 'Singapore GST 9%', taxLabel: 'GST', rate: 9 }],
  ['new-zealand-gst-15', { label: 'New Zealand GST 15%', taxLabel: 'GST', rate: 15 }],
  ['canada-gst-5', { label: 'Canada GST 5%', taxLabel: 'GST', rate: 5 }],
  ['uk-vat-20', { label: 'UK VAT 20%', taxLabel: 'VAT', rate: 20 }],
  ['eu-vat-20', { label: 'EU VAT 20%', taxLabel: 'VAT', rate: 20 }],
  ['south-africa-vat-15', { label: 'South Africa VAT 15%', taxLabel: 'VAT', rate: 15 }]
]);

const LEGACY_DEFAULTS = {
  companyNames: new Set(['Arvo Studio']),
  taglines: new Set(['DESIGN STUDIO', 'Design Studio']),
  emails: new Set(['hello@arvostudio.com']),
  websites: new Set(['www.arvostudio.com']),
  addresses: new Set(['123 Design Street\nSan Francisco, CA 94103']),
  accountNames: new Set(['Arvo Studio', 'Arvo Design Studio'])
};

const invoiceDocument = document.querySelector('#invoiceDocument');
const toolbarInvoiceNumber = document.querySelector('#toolbarInvoiceNumber');
const brandModeControl = document.querySelector('#brandModeControl');
const companyNameControl = document.querySelector('#companyNameControl');
const taglineControl = document.querySelector('#taglineControl');
const brandFontControl = document.querySelector('#brandFontControl');
const logoUploadControl = document.querySelector('#logoUploadControl');
const removeLogoButton = document.querySelector('#removeLogoButton');
const statusControl = document.querySelector('#statusControl');
const currencyControl = document.querySelector('#currencyControl');
const taxPresetControl = document.querySelector('#taxPresetControl');
const taxControl = document.querySelector('#taxControl');
const generateInvoiceButton = document.querySelector('#generateInvoiceButton');
const chatFillButton = document.querySelector('#chatFillButton');
const chatPanel = document.querySelector('#chatPanel');
const chatDetailsInput = document.querySelector('#chatDetailsInput');
const applyChatButton = document.querySelector('#applyChatButton');
const closeChatButton = document.querySelector('#closeChatButton');
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
    const mergedState = {
      ...structuredClone(DEFAULT_INVOICE),
      ...savedState,
      studio: { ...DEFAULT_INVOICE.studio, ...savedState.studio },
      invoice: { ...DEFAULT_INVOICE.invoice, ...savedState.invoice },
      client: { ...DEFAULT_INVOICE.client, ...savedState.client },
      payment: { ...DEFAULT_INVOICE.payment, ...savedState.payment },
      items: Array.isArray(savedState.items) && savedState.items.length ? savedState.items : structuredClone(DEFAULT_INVOICE.items)
    };
    return migrateLegacyDefaults(mergedState);
  } catch (error) {
    console.error('Unable to load invoice state:', error);
    return structuredClone(DEFAULT_INVOICE);
  }
}

function migrateLegacyDefaults(invoiceState) {
  if (LEGACY_DEFAULTS.companyNames.has(invoiceState.studio.companyName)) {
    invoiceState.studio.companyName = DEFAULT_INVOICE.studio.companyName;
  }
  if (LEGACY_DEFAULTS.taglines.has(invoiceState.studio.tagline)) {
    invoiceState.studio.tagline = DEFAULT_INVOICE.studio.tagline;
  }
  if (LEGACY_DEFAULTS.emails.has(invoiceState.studio.email)) {
    invoiceState.studio.email = DEFAULT_INVOICE.studio.email;
  }
  if (LEGACY_DEFAULTS.websites.has(invoiceState.studio.website)) {
    invoiceState.studio.website = DEFAULT_INVOICE.studio.website;
  }
  if (LEGACY_DEFAULTS.addresses.has(invoiceState.studio.address)) {
    invoiceState.studio.address = DEFAULT_INVOICE.studio.address;
  }
  if (LEGACY_DEFAULTS.accountNames.has(invoiceState.payment.accountName)) {
    invoiceState.payment.accountName = invoiceState.studio.companyName || DEFAULT_INVOICE.payment.accountName;
  }
  return invoiceState;
}

function isDefaultPaymentAccount(value, previousCompanyName = '') {
  const defaultAccountNames = new Set([
    DEFAULT_INVOICE.payment.accountName,
    DEFAULT_INVOICE.studio.companyName,
    previousCompanyName,
    ...LEGACY_DEFAULTS.accountNames
  ].filter(Boolean));
  return defaultAccountNames.has(String(value || '').trim());
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

function getCurrencyCode() {
  return CURRENCIES.has(state.currency) ? state.currency : DEFAULT_INVOICE.currency;
}

function formatCurrency(value, compact = false) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  const currency = getCurrencyCode();
  const currencyConfig = CURRENCIES.get(currency);
  const fractionDigits = currencyConfig?.fractionDigits ?? 2;
  const formatted = new Intl.NumberFormat(currencyConfig?.locale || 'en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(amount);
  return compact ? formatted.replace(/^(\D+)(?=\d)/, '$1 ') : formatted;
}

function parseMoney(value) {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTotals() {
  const subtotal = state.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const taxLines = getTaxLines(subtotal);
  const tax = taxLines.reduce((sum, line) => sum + line.amount, 0);
  return { subtotal, tax, taxLines, total: subtotal + tax };
}

function setPath(path, value) {
  const keys = path.split('.');
  let current = state;
  keys.slice(0, -1).forEach((key) => {
    current = current[key];
  });
  current[keys.at(-1)] = value;
}

function getTaxPreset() {
  return TAX_PRESETS.get(state.taxPreset) || TAX_PRESETS.get(DEFAULT_INVOICE.taxPreset);
}

function getTaxLabel() {
  return getTaxPreset()?.taxLabel || state.taxLabel || DEFAULT_INVOICE.taxLabel;
}

function getTaxLines(subtotal) {
  const preset = getTaxPreset();
  const totalRate = Number(state.taxRate || 0);

  if (preset?.split?.length) {
    const splitRate = totalRate / preset.split.length;
    return preset.split.map((label) => ({
      label,
      rate: splitRate,
      amount: subtotal * (splitRate / 100)
    }));
  }

  return [{
    label: getTaxLabel(),
    rate: totalRate,
    amount: subtotal * (totalRate / 100)
  }];
}

function getPaymentTerms() {
  return String(state.payment.terms || DEFAULT_INVOICE.payment.terms).trim() || DEFAULT_INVOICE.payment.terms;
}

function renderTaxLines(taxLines) {
  return taxLines.map((line) => `
    <div class="total-line tax-line">
      <span class="tiny-label">${spacedText(`${line.label} (${Number(line.rate || 0).toFixed(1)}%)`)}</span>
      <strong data-tax>${formatCurrency(line.amount)}</strong>
    </div>
  `).join('');
}

function applyTaxPreset(presetId) {
  const preset = TAX_PRESETS.get(presetId) || TAX_PRESETS.get('custom');
  state.taxPreset = presetId && TAX_PRESETS.has(presetId) ? presetId : 'custom';
  state.taxLabel = preset.taxLabel || DEFAULT_INVOICE.taxLabel;

  if (Number.isFinite(Number(preset.rate))) {
    state.taxRate = Number(preset.rate);
  }
}

function normalizeCurrency(value) {
  const currency = String(value || '').trim().toUpperCase();
  return CURRENCIES.has(currency) ? currency : '';
}

function findTaxPreset(value, currencyCode = state.currency) {
  const normalizedValue = normalizeLabel(value);
  if (!normalizedValue) return '';
  const currency = normalizeCurrency(currencyCode) || getCurrencyCode();
  const rateMatch = normalizedValue.match(/\b(5|9|10|12|15|18|20|28)\b/);
  const rate = rateMatch?.[1] || '';

  for (const [id, preset] of TAX_PRESETS) {
    const normalizedId = normalizeLabel(id);
    const normalizedLabel = normalizeLabel(preset.label);
    if (normalizedValue === normalizedId || normalizedValue === normalizedLabel) {
      return id;
    }
  }

  if (normalizedValue.includes('no tax') || normalizedValue === 'none') return 'none';

  if (normalizedValue.includes('igst') && (!rate || rate === '18')) return 'india-igst-18';
  if (normalizedValue.includes('india') && normalizedValue.includes('28')) return 'india-gst-28';
  if (normalizedValue.includes('india') && normalizedValue.includes('18')) return 'india-gst-18';
  if (normalizedValue.includes('india') && normalizedValue.includes('12')) return 'india-gst-12';
  if (normalizedValue.includes('india') && normalizedValue.includes('5')) return 'india-gst-5';
  if (normalizedValue.includes('australia') || normalizedValue.includes('australian')) return 'australia-gst-10';
  if (normalizedValue.includes('singapore')) return 'singapore-gst-9';
  if (normalizedValue.includes('new zealand') || normalizedValue.includes('nz')) return 'new-zealand-gst-15';
  if (normalizedValue.includes('canada')) return 'canada-gst-5';
  if (normalizedValue.includes('uk') || normalizedValue.includes('united kingdom')) return 'uk-vat-20';
  if (normalizedValue.includes('eu') || normalizedValue.includes('europe')) return 'eu-vat-20';
  if (normalizedValue.includes('south africa')) return 'south-africa-vat-15';

  if (normalizedValue.includes('gst')) {
    if ((currency === 'INR' || normalizedValue.includes('cgst') || normalizedValue.includes('sgst')) && ['5', '12', '18', '28'].includes(rate)) {
      return `india-gst-${rate}`;
    }
    if (currency === 'AUD' && (!rate || rate === '10')) return 'australia-gst-10';
    if (currency === 'SGD' && (!rate || rate === '9')) return 'singapore-gst-9';
    if (currency === 'NZD' && (!rate || rate === '15')) return 'new-zealand-gst-15';
    if (currency === 'CAD' && (!rate || rate === '5')) return 'canada-gst-5';
  }

  if (normalizedValue.includes('vat')) {
    if (currency === 'GBP' && (!rate || rate === '20')) return 'uk-vat-20';
    if (currency === 'ZAR' && (!rate || rate === '15')) return 'south-africa-vat-15';
    if (!rate || rate === '20') return 'eu-vat-20';
  }

  return '';
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

function normalizePlainBrandText(value) {
  return String(value || DEFAULT_INVOICE.studio.companyName)
    .replace(/\s+/g, ' ')
    .trim() || DEFAULT_INVOICE.studio.companyName;
}

function getBrandFont() {
  const allowedFonts = new Set(['dot', 'sans', 'mono', 'serif']);
  return allowedFonts.has(state.studio.brandFont) ? state.studio.brandFont : 'dot';
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
  const companyName = state.studio.companyName ?? DEFAULT_INVOICE.studio.companyName;
  if (state.studio.brandMode === 'logo' && isSafeLogoDataUrl(state.studio.logoDataUrl)) {
    return `
      <img class="brand-logo-image" src="${state.studio.logoDataUrl}" alt="${escapeHtml(companyName)} logo" />
    `;
  }

  const brandFont = getBrandFont();
  if (brandFont !== 'dot') {
    return `
      <div class="brand-text-logo brand-font-${brandFont}">${escapeHtml(normalizePlainBrandText(companyName))}</div>
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
        <p class="studio-label editable" contenteditable="true" data-path="studio.tagline" data-brand-tagline>${spacedText(state.studio.tagline ?? DEFAULT_INVOICE.studio.tagline)}</p>
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
        <div class="tax-lines" data-tax-lines>
          ${renderTaxLines(totals.taxLines)}
        </div>
        <div class="dash-line"></div>
        <p class="tiny-label">${spacedText('TOTAL')}</p>
        <strong class="grand-total" data-total>${formatCurrency(totals.total, true)}</strong>
        <div class="barcode" aria-hidden="true"></div>
        <div class="payment-note">
          <span class="circle-arrow">${icon('arrow')}</span>
          <p>Please make payment within <strong class="editable" contenteditable="true" data-path="payment.terms">${escapeHtml(getPaymentTerms())}</strong> of the invoice date.</p>
        </div>
      </aside>
    </section>
  `;

  updateToolbar();
}

function updateToolbar() {
  toolbarInvoiceNumber.textContent = state.invoice.number;
  brandModeControl.value = state.studio.brandMode || 'text';
  companyNameControl.value = state.studio.companyName ?? DEFAULT_INVOICE.studio.companyName;
  taglineControl.value = state.studio.tagline ?? DEFAULT_INVOICE.studio.tagline;
  brandFontControl.value = getBrandFont();
  removeLogoButton.hidden = !isSafeLogoDataUrl(state.studio.logoDataUrl);
  statusControl.value = state.invoice.status;
  currencyControl.value = getCurrencyCode();
  taxPresetControl.value = TAX_PRESETS.has(state.taxPreset) ? state.taxPreset : 'custom';
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
  document.querySelector('[data-tax-lines]').innerHTML = renderTaxLines(totals.taxLines);
  document.querySelector('[data-total]').textContent = formatCurrency(totals.total, true);
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
      }

      function waitForPrintAssets() {
        const imagePromises = Array.from(document.images)
          .filter((image) => !image.complete)
          .map((image) => new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          }));
        const fontPromise = document.fonts?.ready?.catch(() => undefined) || Promise.resolve();
        return Promise.all([fontPromise, ...imagePromises]);
      }`;
}

function getCurrentStylesheetText() {
  return Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n');
      } catch (error) {
        return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

function getPrintDocumentHtml() {
  const stylesheetUrl = new URL('src/styles.css', window.location.href).href;
  const invoiceNumber = state.invoice.number.replace(/[^a-z0-9.-]+/gi, '-');
  const stylesheetText = getCurrentStylesheetText();
  const stylesheetTag = stylesheetText
    ? `<style>${stylesheetText.replace(/<\/style/gi, '<\\/style')}</style>`
    : `<link rel="stylesheet" href="${stylesheetUrl}" />`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${escapeHtml(invoiceNumber)}</title>
    <link rel="icon" href="data:," />
    ${stylesheetTag}
  </head>
  <body class="print-window">
    <main class="print-page">
      ${invoiceDocument.outerHTML}
    </main>
    <script>
${getPrintFitScript()}
      window.addEventListener('load', () => {
        waitForPrintAssets().then(() => {
          fitInvoiceForPrint();
          requestAnimationFrame(() => requestAnimationFrame(() => {
            window.focus();
            window.print();
          }));
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
    fitScript.textContent = `${getPrintFitScript()}; waitForPrintAssets().then(() => { fitInvoiceForPrint(); window.focus(); window.print(); });`;
    document.body.append(fitScript);
    setTimeout(() => fitScript.remove(), 1000);
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

function generateInvoiceNumber() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `INV-${year}${month}${day}-${hour}${minute}`;
}

function normalizeLabel(label) {
  return String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function setFieldValue(fieldValues, key, value, options = {}) {
  const cleanValue = String(value ?? '').trim();
  if (!cleanValue) return false;
  fieldValues[key] = options.append && fieldValues[key]
    ? `${fieldValues[key]}\n${cleanValue}`
    : cleanValue;
  return true;
}

function parseLabeledLine(line) {
  const labelMatch = String(line || '').match(/^([a-zA-Z][a-zA-Z0-9 /_.-]{0,38}?)\s*(?::|=|\s-\s|\s\u2013\s|\s\u2014\s)\s*(.*)$/);
  if (!labelMatch) return null;

  return {
    label: normalizeLabel(labelMatch[1]),
    value: labelMatch[2].trim()
  };
}

function normalizePaymentTerms(value) {
  const cleanValue = String(value || '').trim().replace(/^within\s+/i, '');
  const netDays = cleanValue.match(/^net\s+(\d+)$/i);
  if (netDays) return `${netDays[1]} days`;
  if (/^\d+$/.test(cleanValue)) return `${cleanValue} days`;
  return cleanValue || DEFAULT_INVOICE.payment.terms;
}

function parseNaturalLabeledLine(line) {
  const naturalMatch = String(line || '').match(/^(company|business|client|customer|bill to|tagline|font|currency|status|invoice(?: no| number)?|issue date|due date|email|phone|website|site|bank|notes?|payment terms|terms|gst|vat|tax)\s+(.+)$/i);
  if (!naturalMatch) return null;

  return {
    label: normalizeLabel(naturalMatch[1]),
    value: naturalMatch[2].trim()
  };
}

function inferCurrencyFromText(text) {
  const value = String(text || '');
  if (/[₹]|(?:\brs\.?\b|\brupees?\b)/i.test(value)) return 'INR';
  if (/[€]/.test(value)) return 'EUR';
  if (/[£]/.test(value)) return 'GBP';
  if (/\b(?:dollars?|usd)\b|[$]/i.test(value)) return 'USD';

  for (const currency of CURRENCIES.keys()) {
    if (new RegExp(`\\b${currency}\\b`, 'i').test(value)) {
      return currency;
    }
  }

  return '';
}

function inferTaxFromText(text, currencyCode = state.currency) {
  const value = String(text || '');
  const noTaxMatch = value.match(/\b(?:no tax|tax free|zero tax)\b/i);
  if (noTaxMatch) return { preset: 'none' };

  const taxMatch = value.match(/\b(gst|igst|vat|tax)\b[^0-9\n\r]{0,24}(\d+(?:\.\d+)?)\s*%?/i);
  if (!taxMatch) return null;

  const taxKind = taxMatch[1].toUpperCase();
  const rate = Number(taxMatch[2]);
  const preset = findTaxPreset(`${taxKind} ${rate}`, currencyCode);
  if (preset) return { preset };
  if (Number.isFinite(rate)) return { rate };

  return null;
}

function isLikelyClientNameLine(line) {
  const value = String(line || '').trim();
  if (!value || value.length > 80) return false;
  if (parseLineItem(value)) return false;
  if (parseLabeledLine(value) || parseNaturalLabeledLine(value)) return false;
  if (/@|https?:|www\.|[₹$€£]|\b(?:gst|igst|vat|tax|invoice|status|paid|due|draft|currency|inr|usd|eur|gbp|aud|cad|sgd|aed|jpy|nzd|zar|bank|account|routing|phone|email|website|address|date|qty|quantity|total|subtotal)\b/i.test(value)) {
    return false;
  }
  return /[A-Za-z]/.test(value);
}

function applyFreeformHints(fieldValues, freeformLines, fullText) {
  if (!fieldValues.currency) {
    setFieldValue(fieldValues, 'currency', inferCurrencyFromText(fullText));
  }

  if (!fieldValues.taxPreset && !fieldValues.taxRate) {
    const inferredTax = inferTaxFromText(fullText, fieldValues.currency || state.currency);
    if (inferredTax?.preset) {
      setFieldValue(fieldValues, 'taxPreset', inferredTax.preset);
    } else if (Number.isFinite(inferredTax?.rate)) {
      setFieldValue(fieldValues, 'taxRate', inferredTax.rate);
    }
  }

  if (!fieldValues['client.name']) {
    const clientName = freeformLines.find(isLikelyClientNameLine);
    setFieldValue(fieldValues, 'client.name', clientName);
  }
}

function parseLineItem(line) {
  const cleaned = String(line || '').replace(/^[-*+]\s*/, '').trim();
  if (!cleaned) return null;

  const priceMatch = cleaned.match(/(?:price|rate|unit|amount)?\s*\$?\s*([0-9][0-9,]*(?:\.\d{1,2})?)\s*$/i);
  if (!priceMatch) return null;

  const quantityMatch = cleaned.match(/(?:qty|quantity)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    || cleaned.match(/\b(\d+(?:\.\d+)?)\s*x\b/i)
    || cleaned.match(/\bx\s*(\d+(?:\.\d+)?)\b/i);
  const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;
  const unitPrice = parseMoney(priceMatch[1]);
  const description = cleaned
    .slice(0, priceMatch.index)
    .replace(/(?:qty|quantity)\s*[:=]?\s*\d+(?:\.\d+)?/ig, '')
    .replace(/\b\d+(?:\.\d+)?\s*x\b/ig, '')
    .replace(/\bx\s*\d+(?:\.\d+)?\b/ig, '')
    .replace(/[,|-]+$/g, '')
    .trim();

  if (!description || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    description,
    quantity,
    unitPrice
  };
}

function parseInvoiceDetails(text) {
  const fieldValues = {};
  const items = [];
  const multilineFields = new Set(['studio.address', 'client.address', 'notes']);
  const labelMap = new Map([
    ['company', 'studio.companyName'],
    ['company name', 'studio.companyName'],
    ['business', 'studio.companyName'],
    ['business name', 'studio.companyName'],
    ['tagline', 'studio.tagline'],
    ['studio label', 'studio.tagline'],
    ['subtitle', 'studio.tagline'],
    ['font', 'studio.brandFont'],
    ['brand font', 'studio.brandFont'],
    ['currency', 'currency'],
    ['email', 'studio.email'],
    ['phone', 'studio.phone'],
    ['website', 'studio.website'],
    ['web domain', 'studio.website'],
    ['domain', 'studio.website'],
    ['company domain', 'studio.website'],
    ['business domain', 'studio.website'],
    ['website domain', 'studio.website'],
    ['site', 'studio.website'],
    ['studio address', 'studio.address'],
    ['business address', 'studio.address'],
    ['from address', 'studio.address'],
    ['invoice', 'invoice.number'],
    ['invoice no', 'invoice.number'],
    ['invoice number', 'invoice.number'],
    ['issue date', 'invoice.issueDate'],
    ['date', 'invoice.issueDate'],
    ['due date', 'invoice.dueDate'],
    ['status', 'invoice.status'],
    ['client', 'client.name'],
    ['client name', 'client.name'],
    ['bill to', 'client.name'],
    ['customer', 'client.name'],
    ['customer name', 'client.name'],
    ['client address', 'client.address'],
    ['billing address', 'client.address'],
    ['customer address', 'client.address'],
    ['tax', 'taxRate'],
    ['tax rate', 'taxRate'],
    ['tax type', 'taxPreset'],
    ['tax option', 'taxPreset'],
    ['tax preset', 'taxPreset'],
    ['gst', 'taxPreset'],
    ['igst', 'taxPreset'],
    ['vat', 'taxPreset'],
    ['notes', 'notes'],
    ['note', 'notes'],
    ['bank', 'payment.bank'],
    ['bank name', 'payment.bank'],
    ['account name', 'payment.accountName'],
    ['account no', 'payment.accountNumber'],
    ['account number', 'payment.accountNumber'],
    ['routing no', 'payment.routingNumber'],
    ['routing number', 'payment.routingNumber'],
    ['payment terms', 'payment.terms'],
    ['terms', 'payment.terms'],
    ['due within', 'payment.terms'],
    ['payment due', 'payment.terms'],
    ['pay within', 'payment.terms']
  ]);
  const itemLabels = new Set(['items', 'item', 'line items', 'services', 'service']);
  const addressContinuationLabels = new Set(['attn', 'attention', 'building', 'floor', 'suite', 'unit']);

  let currentField = '';
  let currentFieldMode = '';
  let inItems = false;
  const freeformLines = [];

  String(text || '').replace(/\r/g, '').split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const labeledLine = parseLabeledLine(line) || parseNaturalLabeledLine(line);
    if (labeledLine) {
      const { label, value } = labeledLine;

      if (itemLabels.has(label)) {
        inItems = true;
        currentField = '';
        currentFieldMode = '';
        const parsedItem = parseLineItem(value);
        if (parsedItem) items.push(parsedItem);
        return;
      }

      const key = labelMap.get(label);
      if (key) {
        inItems = false;
        const isMultilineField = multilineFields.has(key);
        const fieldValue = key === 'taxPreset' && ['gst', 'vat', 'igst'].includes(label)
          ? `${label} ${value}`.trim()
          : value;
        currentField = value ? (isMultilineField ? key : '') : key;
        currentFieldMode = isMultilineField ? 'multiline' : 'single';
        setFieldValue(fieldValues, key, fieldValue);
        if (value && !isMultilineField) {
          currentField = '';
          currentFieldMode = '';
        }
        return;
      }

      if (!inItems) {
        if (currentFieldMode === 'multiline' && currentField.endsWith('.address') && addressContinuationLabels.has(label)) {
          setFieldValue(fieldValues, currentField, line, { append: true });
        }
        currentField = '';
        currentFieldMode = '';
        return;
      }
    }

    if (inItems || /^[-*+]\s+/.test(line)) {
      const parsedItem = parseLineItem(line);
      if (parsedItem) items.push(parsedItem);
      return;
    }

    const parsedFreeformItem = parseLineItem(line);
    if (parsedFreeformItem) {
      items.push(parsedFreeformItem);
      return;
    }

    if (currentField) {
      setFieldValue(fieldValues, currentField, line, { append: currentFieldMode === 'multiline' });
      if (currentFieldMode === 'single') {
        currentField = '';
        currentFieldMode = '';
      }
      return;
    }

    freeformLines.push(line);
  });

  applyFreeformHints(fieldValues, freeformLines, text);

  return { fieldValues, items };
}

function applyParsedInvoiceDetails(parsedDetails) {
  const { fieldValues, items } = parsedDetails;
  const previousCompanyName = state.studio.companyName;
  const parsedCurrency = normalizeCurrency(fieldValues.currency);
  if (parsedCurrency) {
    state.currency = parsedCurrency;
  }

  Object.entries(fieldValues).forEach(([path, value]) => {
    if (path === 'taxRate') {
      state.taxRate = parseMoney(value);
      state.taxPreset = 'custom';
      state.taxLabel = DEFAULT_INVOICE.taxLabel;
      return;
    }
    if (path === 'taxPreset') {
      const presetId = findTaxPreset(value, state.currency);
      if (presetId) {
        applyTaxPreset(presetId);
      }
      return;
    }
    if (path === 'currency') {
      const currency = normalizeCurrency(value);
      if (currency) {
        state.currency = currency;
      }
      return;
    }
    if (path === 'payment.terms') {
      state.payment.terms = normalizePaymentTerms(value);
      return;
    }
    if (path === 'invoice.status') {
      state.invoice.status = value.toUpperCase();
      return;
    }
    if (path === 'studio.brandFont') {
      const font = normalizeLabel(value);
      if (['dot', 'sans', 'mono', 'serif'].includes(font)) {
        state.studio.brandFont = font;
        state.studio.brandMode = 'text';
      }
      return;
    }
    setPath(path, value);
  });

  if (
    fieldValues['studio.companyName']
    && !fieldValues['payment.accountName']
    && isDefaultPaymentAccount(state.payment.accountName, previousCompanyName)
  ) {
    state.payment.accountName = state.studio.companyName;
  }

  if (items.length) {
    state.items = items;
  }

  saveState();
  renderInvoice();
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
    if (editable.dataset.path === 'studio.tagline') {
      taglineControl.value = state.studio.tagline;
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

brandFontControl.addEventListener('change', () => {
  state.studio.brandFont = brandFontControl.value;
  state.studio.brandMode = 'text';
  saveState();
  renderInvoice();
});

companyNameControl.addEventListener('input', () => {
  const previousCompanyName = state.studio.companyName;
  if (isDefaultPaymentAccount(state.payment.accountName, previousCompanyName)) {
    state.payment.accountName = companyNameControl.value || DEFAULT_INVOICE.payment.accountName;
  }
  state.studio.companyName = companyNameControl.value;
  state.studio.brandMode = 'text';
  saveState();
  renderInvoice();
});

taglineControl.addEventListener('input', () => {
  state.studio.tagline = taglineControl.value;
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

generateInvoiceButton.addEventListener('click', () => {
  state.invoice.number = generateInvoiceNumber();
  saveState();
  renderInvoice();
});

chatFillButton.addEventListener('click', () => {
  chatPanel.hidden = !chatPanel.hidden;
  if (!chatPanel.hidden) {
    chatDetailsInput.focus();
  }
});

closeChatButton.addEventListener('click', () => {
  chatPanel.hidden = true;
});

applyChatButton.addEventListener('click', () => {
  const parsedDetails = parseInvoiceDetails(chatDetailsInput.value);
  applyParsedInvoiceDetails(parsedDetails);
  chatPanel.hidden = true;
});

statusControl.addEventListener('change', () => {
  state.invoice.status = statusControl.value;
  saveState();
  document.querySelector('[data-status-value] span:last-child').textContent = state.invoice.status;
});

currencyControl.addEventListener('change', () => {
  state.currency = currencyControl.value;
  saveState();
  renderInvoice();
});

taxPresetControl.addEventListener('change', () => {
  applyTaxPreset(taxPresetControl.value);
  saveState();
  renderInvoice();
});

taxControl.addEventListener('input', () => {
  state.taxRate = Number(taxControl.value || 0);
  state.taxPreset = 'custom';
  state.taxLabel = DEFAULT_INVOICE.taxLabel;
  taxPresetControl.value = state.taxPreset;
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
