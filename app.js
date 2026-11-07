const STORE = {
  name: 'NOAH Digital Store',
  supportPhone: '+255 745 468 020',
  whatsappNumber: '255745468020',
  location: 'Cheyo, Tabora, Tanzania',
  lipaNamba: '251268047',
};

const services = [
  { id: 'inquiry', name: 'Product Inquiry and Seller/Shop Price Research', fee: 1000 },
  { id: 'research', name: 'Product Price Research', fee: 2000 },
  { id: 'sourcing', name: 'Product Sourcing and Delivery', fee: 5000 },
];

// Categories, products, brands and hero slides now live in catalog.js (loaded before this file).
const slideSeconds = 10;
const money = (value) => `TZS ${new Intl.NumberFormat('en-TZ').format(value)}`;
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const loadBag = () => {
  try { return JSON.parse(localStorage.getItem('noah-store-bag') || '[]'); } catch { return []; }
};
const state = { bag: loadBag(), slide: 0, filters: { category: '', search: '', brand: '', maxPrice: '', stockOnly: false, sort: 'featured' }, toastTimer: null };
const $ = (selector, root = document) => root.querySelector(selector);
// Pick up to n products, rotating through categories so every section shows variety.
function diverse(list, n) {
  const groups = new Map();
  list.forEach((item) => { if (!groups.has(item.category)) groups.set(item.category, []); groups.get(item.category).push(item); });
  const out = [];
  while (out.length < n && [...groups.values()].some((g) => g.length)) groups.forEach((g) => { if (g.length && out.length < n) out.push(g.shift()); });
  return out;
}
const categoryOf = (name) => categories.find((item) => item.name === name);
const categoryThumb = (item, cls) => `<img class="${cls}" src="${item.image}" alt="" loading="lazy" decoding="async" />`;
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function renderCategoryMenus() {
  const side = $('#sidebar-categories');
  const mega = $('#mega-categories');
  if (!side || !mega) return;
  side.innerHTML = categories.map((item) => `<button class="sidebar-category" data-category="${escapeHtml(item.name)}"><span class="category-emoji">${categoryThumb(item, 'cat-thumb')}</span><b>${escapeHtml(item.name)}</b><span>›</span></button>`).join('');
  mega.innerHTML = categories.map((item) => `<button class="mega-category" data-category="${escapeHtml(item.name)}"><span class="category-emoji">${categoryThumb(item, 'cat-thumb')}</span><b>${escapeHtml(item.name)}</b><span>↗</span></button>`).join('');
  const quickCategories = ['Smartphones & Accessories', 'Laptops & Accessories', 'Chargers & Adapters', 'Earphones & Headphones', 'Bluetooth Speakers', 'Power Banks', 'Keyboards & Mice', 'Printers & Accessories', 'Networking Devices'];
  $('#quick-categories').innerHTML = quickCategories.map((name) => {
    const item = categories.find((category) => category.name === name);
    return `<button class="quick-category" data-category="${escapeHtml(name)}"><span class="quick-icon">${categoryThumb(item, 'quick-thumb')}</span><b>${escapeHtml(item.short || name)}</b></button>`;
  }).join('');
}

function priceBlock(product, large = false) {
  if (product.price == null) return `<span class="price-now quote"><b>Request a quote</b></span>`;
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  return `<span class="price-now"><small>TZS</small><b>${new Intl.NumberFormat('en-TZ').format(product.price)}</b></span>${product.oldPrice ? `<span class="price-old"><del>${money(product.oldPrice)}</del>${large ? '' : `<em>−${discount}%</em>`}</span>` : ''}`;
}

function slideshowImages(product, index = 0) {
  const images = product.images && product.images.length ? product.images : [product.image];
  const offset = ((index * 1.9) % slideSeconds).toFixed(1);
  const classes = ['s1', 's2', 's3'];
  return `<span class="slideshow" style="--o:${offset}s">${images.slice(0, 3).map((src, i) => `<img class="slide ${classes[i]}" src="${src}" alt="${i === 0 ? escapeHtml(product.name) : ''}" ${i === 0 ? '' : 'aria-hidden="true"'} loading="lazy" decoding="async" onerror="this.style.visibility='hidden'" />`).join('')}</span>`;
}

function productCard(product, index = 0) {
  const quoteOnly = product.price == null;
  return `<article class="product-card">
    <button class="product-image-button" data-product="${product.id}" aria-label="View ${escapeHtml(product.name)}">
      ${slideshowImages(product, index)}
      ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}
      <span class="stock-note ${quoteOnly ? '' : product.stock ? '' : 'out'}">${quoteOnly ? 'Request a quote' : product.stock ? 'In stock' : 'Sold out'}</span>
    </button>
    <div class="product-info">
      <p class="product-brand">${escapeHtml(product.brand)} · ${escapeHtml(product.category)}</p>
      <button class="product-title" data-product="${product.id}">${escapeHtml(product.name)}</button>
      ${product.rating ? `<div class="product-rating"><span>★</span><b>${product.rating}</b><span class="review-count">(${product.reviews})</span></div>` : ''}
      <div class="product-bottom"><span class="product-price">${priceBlock(product)}</span><button class="add-to-bag" data-add="${product.id}" aria-label="Add ${escapeHtml(product.name)} to bag">+</button></div>
    </div>
  </article>`;
}

function fillProductSections() {
  $('#bestseller-grid').innerHTML = diverse(products.filter((item) => item.bestseller), 10).map(productCard).join('');
  $('#new-grid').innerHTML = diverse(products.filter((item) => item.isNew), 5).map(productCard).join('');
  $('#accessories-grid').innerHTML = diverse(products.filter((item) => ['Chargers & Adapters', 'Phone Covers & Cases', 'Screen Protectors', 'Power Banks', 'Other Digital Accessories'].includes(item.category)), 5).map(productCard).join('');
  $('#trending-grid').innerHTML = diverse(products.filter((item) => item.trending), 5).map(productCard).join('');
  $('#deal-items').innerHTML = products.filter((item) => item.oldPrice && ['Smartphones & Accessories', 'Earphones & Headphones', 'Bluetooth Speakers'].includes(item.category)).slice(1, 4).map((item) => `<button class="deal-product" data-product="${item.id}"><img src="${item.image}" alt="" loading="lazy" /><span><b>${escapeHtml(item.name)}</b><small>${money(item.price)}</small></span></button>`).join('');
  $('#brand-list').innerHTML = brands.map((brand) => `<button class="brand-name-button" data-brand="${escapeHtml(brand)}">${escapeHtml(brand)}</button>`).join('');
}

function renderBagCount() {
  const count = state.bag.reduce((sum, item) => sum + item.quantity, 0);
  $$('.bag-count').forEach((el) => { el.textContent = count; });
  const bubble = $('.bag-count-bubble');
  bubble.textContent = count;
  bubble.classList.toggle('has-items', count > 0);
  localStorage.setItem('noah-store-bag', JSON.stringify(state.bag));
}

function toast(message) {
  const el = $('.toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => { el.hidden = true; }, 2500);
}

function addToBag(productId, quantity = 1, openBag = false) {
  const product = products.find((item) => item.id === productId);
  if (!product || (product.price != null && !product.stock)) return;
  const existing = state.bag.find((item) => item.productId === productId);
  if (existing) existing.quantity = product.price == null ? existing.quantity + quantity : Math.min(product.stock, existing.quantity + quantity);
  else state.bag.push({ productId, quantity: product.price == null ? quantity : Math.min(product.stock, quantity) });
  renderBagCount();
  toast(`${product.name} added to your bag`);
  if (openBag) openBagDrawer();
}

function bagItems() {
  return state.bag.map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) })).filter((line) => line.product);
}

function bagTotal() {
  return bagItems().reduce((sum, line) => sum + (Number(line.product.price) || 0) * line.quantity, 0);
}

function renderBagDrawer() {
  const drawer = $('#bag-drawer');
  const items = bagItems();
  if (!items.length) {
    drawer.innerHTML = `<div class="drawer-header"><div><span class="section-kicker">YOUR PICKS</span><h2>Your bag <small>(0)</small></h2></div><button class="close-button" data-close aria-label="Close bag">×</button></div><div class="empty-bag"><span>▱</span><h3>Your bag is taking a breather.</h3><p>Find something useful and bring it along.</p><button data-close>Explore the shop →</button><button class="checkout-button" data-service-checkout>Request a service <span>→</span></button></div>`;
    return;
  }
  const quoteOnly = items.some(({ product }) => product.price == null);
  drawer.innerHTML = `<div class="drawer-header"><div><span class="section-kicker">YOUR PICKS</span><h2>Your bag <small>(${items.reduce((sum, line) => sum + line.quantity, 0)})</small></h2></div><button class="close-button" data-close aria-label="Close bag">×</button></div><div class="bag-lines">${items.map(({ product, quantity }) => `<article class="bag-line"><img src="${product.image}" alt="" /><div class="bag-line-info"><b>${escapeHtml(product.name)}</b><small>${escapeHtml(product.brand)}</small><span class="bag-line-price">${product.price == null ? 'Request a quote' : money(product.price)}</span><div class="quantity-stepper"><button data-quantity="${product.id}" data-delta="-1" aria-label="Decrease">−</button><span>${quantity}</span><button data-quantity="${product.id}" data-delta="1" aria-label="Increase">+</button></div></div><button class="remove-line" data-remove="${product.id}" aria-label="Remove ${escapeHtml(product.name)}">×</button></article>`).join('')}</div><div class="bag-footer"><div class="bag-total"><span>${quoteOnly ? 'Product price' : 'Subtotal'}</span><b>${quoteOnly ? 'Request a quote' : money(bagTotal())}</b></div><p class="bag-disclaimer">Delivery details and any applicable charges are confirmed with our team.</p><button class="checkout-button" data-checkout>Continue to checkout <span>→</span></button><button class="keep-shopping" data-close>Keep browsing</button></div>`;
}

function openBagDrawer() {
  renderBagDrawer();
  $('#overlay').hidden = false;
  $('#bag-drawer').hidden = false;
  document.body.classList.add('modal-open');
}

function openProduct(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  const quoteOnly = product.price == null;
  const discount = product.oldPrice && product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const modal = $('#product-modal');
  modal.className = 'modal product-detail-modal';
  modal.innerHTML = `<div class="detail-image"><div class="gallery" data-gallery>${(product.images || [product.image]).map((src, i) => `<img class="g-slide ${i === 0 ? 'active' : ''}" src="${src}" alt="${i === 0 ? escapeHtml(product.name) : ''}" />`).join('')}<span class="product-badge">${escapeHtml(product.badge || 'NOAH SELECT')}</span><button class="gallery-nav prev" data-gallery-step="-1" aria-label="Previous picture">‹</button><button class="gallery-nav next" data-gallery-step="1" aria-label="Next picture">›</button><div class="gallery-dots">${(product.images || [product.image]).map((_, i) => `<button class="${i === 0 ? 'active' : ''}" data-gallery-dot="${i}" aria-label="Picture ${i + 1}"></button>`).join('')}</div></div></div><div class="detail-copy"><div class="drawer-header" style="padding:0 0 14px;border:0"><span class="section-kicker">${escapeHtml(product.brand)} · ${escapeHtml(product.category)}</span><button class="close-button" data-close aria-label="Close details">×</button></div><h2>${escapeHtml(product.name)}</h2>${product.rating ? `<div class="detail-rating">★★★★★ <b>${product.rating}</b> <small>(${product.reviews} reviews)</small></div>` : ''}<div class="detail-price">${quoteOnly ? '<b class="quote">Request a quote</b>' : `<span class="price-now"><small>TZS</small><b>${new Intl.NumberFormat('en-TZ').format(product.price)}</b></span>`}${product.oldPrice ? `<del>${money(product.oldPrice)}</del><span class="save-chip">Save ${discount}%</span>` : ''}</div><p class="detail-description">${escapeHtml(product.description)}</p><div class="availability"><i></i>${quoteOnly ? 'Availability and price confirmed on request' : product.stock ? `${product.stock} in stock` : 'Currently unavailable'}</div><div class="spec-list"><h3 style="font:700 11px var(--display);margin:0 0 2px">Good to know</h3>${(product.specs || []).map(([label, value]) => `<div class="spec-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('')}</div><div class="detail-actions"><button data-detail-add="${product.id}">Add to bag</button><button data-detail-buy="${product.id}">Buy now</button></div></div>`;
  $('#overlay').hidden = false;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  startGallery();
}

const galleryState = { index: 0, timer: 0 };
function showGallerySlide(index) {
  const gallery = $('[data-gallery]');
  if (!gallery) return;
  const slides = $$('.g-slide', gallery);
  if (!slides.length) return;
  galleryState.index = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle('active', i === galleryState.index));
  $$('[data-gallery-dot]', gallery).forEach((dot, i) => dot.classList.toggle('active', i === galleryState.index));
}
function startGallery() {
  stopGallery();
  galleryState.index = 0;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  galleryState.timer = setInterval(() => showGallerySlide(galleryState.index + 1), 3200);
}
function stopGallery() { clearInterval(galleryState.timer); galleryState.timer = 0; }

function openCheckout() {
  $('#bag-drawer').hidden = true;
  const modal = $('#checkout-modal');
  const requestedProducts = bagItems().map(({ product, quantity }) => `${quantity} x ${product.name}`).join(', ');
  modal.innerHTML = `<div class="drawer-header"><div><span class="section-kicker">NO ACCOUNT NEEDED · STEP 1 OF 1</span><h2>Tell us what you need.</h2></div><button class="close-button" data-close aria-label="Close checkout">×</button></div><div class="checkout-content"><p>Choose a service, pay its initial fee through TIPS, then share your order details.</p><form class="checkout-form" id="checkout-form"><label>Service<select name="service" required>${services.map((service) => `<option value="${service.id}">${escapeHtml(service.name)} — ${money(service.fee)}</option>`).join('')}</select></label><div class="service-payment-box"><b>Initial fee: <span data-service-fee>${money(services[0].fee)}</span></b><p>Pay via TIPS to <strong>${STORE.lipaNamba}</strong> before submitting. Use NOAH Digital Store as the recipient. The fee is always paid in advance.</p></div><label>Product name<input name="product" required minlength="2" value="${escapeHtml(requestedProducts)}" placeholder="What product are you looking for?" /></label><label>Product description or requirements<textarea name="details" required minlength="4" rows="2" placeholder="Brand, model, size, colour, or other requirements"></textarea></label><label>Full name<input name="name" autocomplete="name" required minlength="2" placeholder="Your name" /></label><label>Phone number<input name="phone" type="tel" autocomplete="tel" required placeholder="e.g. +255 712 345 678" /></label><label>Delivery location<textarea name="location" required minlength="4" rows="2" placeholder="Area, street and helpful directions"></textarea></label><div class="delivery-payment-box" data-delivery-details hidden><label class="delivery-option"><input type="checkbox" name="payOnDelivery" checked /><span><b>Pay the actual product amount on delivery</b><small>Only the TSh 5,000 initial fee is paid now. NOAH will confirm the actual product price before purchase; the product balance is paid upon delivery.</small></span></label></div><label>Payment Transaction Reference Number<input name="reference" required minlength="4" maxlength="80" autocomplete="off" placeholder="Enter the reference from your payment confirmation" /></label><label>Payment date<input name="paymentDate" type="date" required max="${new Date().toISOString().slice(0, 10)}" value="${new Date().toISOString().slice(0, 10)}" /></label><label class="payment-confirmation"><input type="checkbox" name="paidConfirm" required /><span>I have paid the initial service fee of <b data-service-fee-inline>${money(services[0].fee)}</b> to TIPS number <b>${STORE.lipaNamba}</b>.</span></label><div class="checkout-summary"><span>Due now · service fee</span><b data-service-total>${money(services[0].fee)}</b></div><p class="payment-warning">Your reference is recorded as Pending Verification. Entering it does not confirm payment; NOAH staff must verify it before confirming the order.</p><button class="modal-primary" type="submit">Submit service request <span>→</span></button><p class="privacy-note">No account required. WhatsApp sharing remains available after submission.</p></form></div>`;
  updateServiceSelection(modal);
  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function updateServiceSelection(modal) {
  const selected = services.find((service) => service.id === modal.querySelector('[name="service"]').value) || services[0];
  modal.querySelector('[data-service-fee]').textContent = money(selected.fee);
  modal.querySelector('[data-service-fee-inline]').textContent = money(selected.fee);
  modal.querySelector('[data-service-total]').textContent = money(selected.fee);
  modal.querySelector('[data-delivery-details]').hidden = selected.id !== 'sourcing';
}

const PENDING_KEY = 'noah-pending-orders';
function readQueue() { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; } }
function writeQueue(list) { try { localStorage.setItem(PENDING_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ } }
function queueOrder(order) { writeQueue([...readQueue().filter((item) => item.number !== order.number), order]); }
let flushing = false;
async function flushQueue() {
  if (flushing) return;
  const pending = readQueue();
  if (!pending.length) return;
  flushing = true;
  const left = [];
  for (const order of pending) {
    try { await storeDeskOrder(order); } catch (error) { if (error.retryable) left.push(order); }
  }
  writeQueue(left);
  flushing = false;
  if (left.length < pending.length) toast('Your saved order has reached NOAH. Thank you!');
}

function retryable(message) { const error = new Error(message); error.retryable = true; return error; }

async function storeDeskOrder(order) {
  const endpoint = String(window.NOAH_ORDER_API || '').trim();
  if (!endpoint) throw retryable('This page is not connected to the Business Desk yet.');
  let target;
  try { target = new URL(endpoint, window.location.href); } catch { throw retryable('The NOAH order endpoint is not a valid URL.'); }
  if (target.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(target.hostname)) throw retryable('The NOAH order endpoint must use HTTPS.');
  let response;
  try {
    response = await fetch(target.href, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.number,
        receiptNumber: order.receiptNumber,
        submittedAt: order.submittedAt,
        serviceId: order.serviceId,
        serviceFee: order.serviceFee,
        customerName: order.name,
        phone: order.phone,
        productName: order.product,
        productDescription: order.details,
        actualProductPrice: order.actualProductPrice,
        paymentReference: order.reference,
        paymentDate: order.paymentDate,
        paymentMethod: order.paymentMethod,
        tipsNumber: STORE.lipaNamba,
        payOnDelivery: order.payOnDelivery,
        deliveryAddress: order.location,
      }),
    });
  } catch { throw retryable('NOAH could not be reached right now.'); }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || 'The Business Desk could not accept this order. Please try again.');
    error.retryable = response.status >= 500 || response.status === 429;
    throw error;
  }
  return result;
}

function pdfText(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '?').replace(/[\\()]/g, '\\$&');
}

function createReceiptPdf(order) {
  const text = (font, size, x, y, value, color = '0.15 0.20 0.29') => `${color} rg BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`;
  const wrap = (value, limit = 78) => {
    const result = [];
    let current = '';
    String(value || '').split(/\s+/).forEach((word) => {
      if ((current + ' ' + word).trim().length > limit) { if (current) result.push(current); current = word; }
      else current = `${current} ${word}`.trim();
    });
    if (current) result.push(current);
    return result;
  };
  const orderDate = new Date(order.submittedAt).toLocaleString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' });
  const serviceLines = wrap(order.service, 68);
  const productLines = wrap(`Product: ${order.product}`, 88);
  const detailLines = wrap(`Requirements: ${order.details}`, 88);
  const tableRows = [
    ['Service fee · paid in advance', `${money(order.serviceFee)} · PENDING VERIFICATION`],
    ['Actual product price', order.actualProductPrice ? money(order.actualProductPrice) : 'To be confirmed'],
    ['Outstanding product balance', order.payOnDelivery ? 'PAY ON DELIVERY' : money(order.actualProductPrice)],
    ['Total order amount', money(order.serviceFee + (order.actualProductPrice || 0))],
    ['Payment method', order.paymentMethod],
    ['TIPS payment number', STORE.lipaNamba],
    ['Transaction reference', order.reference],
    ['Verification status', order.paymentStatus],
    ['Payment date', order.paymentDate],
  ];
  const commands = [
    '0.09 0.23 0.40 rg', '0 744 612 98 re f',
    '1 1 1 RG 48 786 32 32 re S', text('F2', 18, 57, 794, 'N', '1 1 1'),
    text('F2', 17, 91, 806, STORE.name.toUpperCase(), '1 1 1'),
    text('F1', 10, 91, 785, 'OFFICIAL PAYMENT RECEIPT', '0.86 0.89 0.93'),
    '0.96 0.84 0.30 rg', '50 738 512 3 re f',
    text('F2', 15, 50, 715, order.receiptNumber),
    text('F1', 9, 50, 697, `Order ${order.number} · ${orderDate}`, '0.39 0.44 0.52'),
    '0.86 0.88 0.91 RG 50 681 m 562 681 l S',
    text('F2', 9, 50, 662, 'CUSTOMER', '0.44 0.29 0.56'),
    text('F2', 11, 50, 644, order.name),
    text('F1', 9, 50, 628, order.phone, '0.39 0.44 0.52'),
    ...wrap(order.location, 84).slice(0, 2).map((line, index) => text('F1', 9, 50, 612 - index * 13, line, '0.39 0.44 0.52')),
    '0.91 0.89 0.93 rg', '50 568 512 60 re f',
    text('F2', 9, 62, 610, 'SELECTED SERVICE CATEGORY', '0.44 0.29 0.56'),
    ...serviceLines.slice(0, 2).map((line, index) => text('F2', 10, 62, 592 - index * 13, line)),
    ...productLines.slice(0, 1).map((line) => text('F1', 9, 62, 576, line, '0.39 0.44 0.52')),
    ...detailLines.slice(0, 1).map((line) => text('F1', 9, 62, 563, line, '0.39 0.44 0.52')),
    text('F2', 10, 50, 541, 'PAYMENT BREAKDOWN', '0.44 0.29 0.56'),
    '0.96 0.95 0.97 rg', '50 513 512 20 re f',
    text('F2', 8, 60, 520, 'DESCRIPTION', '0.48 0.45 0.51'),
    text('F2', 8, 332, 520, 'AMOUNT / STATUS', '0.48 0.45 0.51'),
    ...tableRows.flatMap(([label, value], index) => {
      const y = 496 - index * 24;
      const highlight = index === 3;
      return [
        ...(index % 2 === 0 || highlight ? [`${highlight ? '0.91 0.89 0.93' : '0.98 0.97 0.985'} rg`, `50 ${y - 7} 512 22 re f`] : []),
        text(highlight ? 'F2' : 'F1', 8, 60, y, label, highlight ? '0.15 0.20 0.29' : '0.39 0.44 0.52'),
        text(highlight ? 'F2' : 'F1', 8, 332, y, value, '0.15 0.20 0.29'),
      ];
    }),
    '0.86 0.88 0.91 RG 50 270 m 562 270 l S',
    text('F1', 8, 62, 250, order.payOnDelivery ? 'SERVICE FEE: PAID IN ADVANCE' : 'Service fee is paid in advance and is not payable on delivery.', '0.15 0.45 0.33'),
    text('F1', 8, 62, 235, order.payOnDelivery ? 'PRODUCT PAYMENT: PAY ON DELIVERY' : 'Payment reference remains pending manual verification.', '0.39 0.44 0.52'),
    '0.86 0.88 0.91 RG 50 64 m 562 64 l S',
    text('F1', 8, 82, 48, 'NOAH Digital Store · Cheyo, Tabora, Tanzania · TIPS 251268047', '0.39 0.44 0.52'),
  ].join('\n');
  const stream = `${commands}\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}endstream`,
  ];
  let document = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(document.length); document += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([document], { type: 'application/pdf' });
}

async function completeOrder(event) {
  event.preventDefault();
  const submitButton = event.target.querySelector('[type="submit"]');
  if (submitButton.disabled) return;
  submitButton.disabled = true;
  const data = new FormData(event.target);
  const service = services.find((item) => item.id === data.get('service'));
  if (!service || !data.get('paidConfirm') || !String(data.get('reference') || '').trim()) {
    submitButton.disabled = false;
    event.target.reportValidity();
    return;
  }
  let pendingOrder = null;
  try { pendingOrder = JSON.parse(event.target.dataset.pendingOrder || 'null'); } catch {}
  const number = pendingOrder?.number || `ND-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  const submittedAt = pendingOrder?.submittedAt || new Date().toISOString();
  const receiptNumber = pendingOrder?.receiptNumber || `NR-${submittedAt.slice(2, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  const hasQuoteOnly = bagItems().some(({ product }) => product.price == null);
  const actualProductPrice = service.id === 'sourcing' && state.bag.length && !hasQuoteOnly ? bagTotal() : 0;
  const order = {
    number,
    receiptNumber,
    submittedAt,
    serviceId: service.id,
    service: service.name,
    serviceFee: service.fee,
    actualProductPrice,
    paymentMethod: `TIPS ${STORE.lipaNamba}`,
    paymentStatus: 'Pending Verification',
    payOnDelivery: service.id === 'sourcing' && data.get('payOnDelivery') === 'on',
    status: 'Payment Verification Required',
    name: data.get('name'),
    phone: data.get('phone'),
    location: data.get('location'),
    product: data.get('product'),
    details: data.get('details'),
    reference: String(data.get('reference')).trim(),
    paymentDate: data.get('paymentDate'),
  };
  event.target.dataset.pendingOrder = JSON.stringify(order);
  try {
    await storeDeskOrder(order);
  } catch (error) {
    if (error.retryable) {
      // The desk is offline or not reachable: keep the order on this device and resend automatically.
      queueOrder(order);
      order.queued = true;
    } else {
      submitButton.disabled = false;
      toast(error.message || 'We could not save your order. Please try again.');
      console.error('Order storage failed:', error);
      return;
    }
  }
  delete event.target.dataset.pendingOrder;
  state.bag = [];
  renderBagCount();
  const modal = $('#checkout-modal');
  const receiptUrl = URL.createObjectURL(createReceiptPdf(order));
  modal.innerHTML = `<div class="drawer-header"><div><span class="section-kicker">THANK YOU, ${escapeHtml(order.name.split(' ')[0])}</span><h2>Order received.</h2></div><button class="close-button" data-close aria-label="Close">×</button></div><div class="confirmation-content"><span class="confirmation-check">✓</span><h3>Your service request is recorded.</h3><div class="order-number"><span>Order number</span><b>${order.number}</b></div><div class="order-status"><span>◷</span><div><b>Payment Pending Verification</b><small>${order.queued ? 'Your order is saved on this device and will be sent to NOAH automatically. Tap the WhatsApp button below so we receive it right now.' : 'Your TIPS reference has been saved. NOAH staff will verify payment before confirming the order.'}</small></div></div><p class="payment-warning">Service fee prepaid: ${money(order.serviceFee)}. ${order.payOnDelivery ? `Product amount ${order.actualProductPrice ? money(order.actualProductPrice) : 'to be confirmed'} is due on delivery.` : 'Product amount and next steps will be confirmed by NOAH.'}</p><a class="modal-primary receipt-download" href="${receiptUrl}" download="${order.receiptNumber}.pdf">Download PDF Receipt <span>↓</span></a><button class="modal-primary" data-send-order>Send order to NOAH on WhatsApp <span>↗</span></button><p class="confirmation-note">${order.queued ? 'Order saved on this device. Keep the receipt and send the order to NOAH on WhatsApp.' : 'Order, payment reference and receipt details are saved for the NOAH Business Desk.'}</p></div>`;
  modal.dataset.order = JSON.stringify(order);
}

function sendWhatsAppOrder() {
  const order = JSON.parse($('#checkout-modal').dataset.order || '{}');
  const lines = [`Order ${order.number}`, `Receipt: ${order.receiptNumber}`, `Name: ${order.name}`, `Phone: ${order.phone}`, `Delivery: ${order.location}`, `Service: ${order.service} — ${money(order.serviceFee)}`, `Product: ${order.product}`, `Requirements: ${order.details}`, `TIPS payment reference: ${order.reference}`, `Payment method: ${order.paymentMethod}`, `Payment status: ${order.paymentStatus}`, `Pay on delivery: ${order.payOnDelivery ? 'Product amount only' : 'No'}`, `Status: ${order.status}`];
  if (!STORE.whatsappNumber) return toast('WhatsApp is not configured. Please call NOAH directly.');
  window.open(`https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
}

function closeLayers() {
  stopGallery();
  $('#overlay').hidden = true;
  $('#bag-drawer').hidden = true;
  $('#product-modal').hidden = true;
  $('#checkout-modal').hidden = true;
  document.body.classList.remove('modal-open');
}

function openCatalog({ category = '', search = '', brand = '', newOnly = false, dealsOnly = false } = {}) {
  state.filters = { category, search, brand, maxPrice: '', stockOnly: false, sort: newOnly ? 'newest' : 'featured', newOnly, dealsOnly };
  const main = $('.store-main');
  const selected = category ? categories.find((item) => item.name === category)?.name : '';
  const title = selected || (search ? `Results for “${escapeHtml(search)}”` : dealsOnly ? 'Special offers' : newOnly ? 'New arrivals' : 'Shop all products');
  main.innerHTML = `<section class="catalog-view"><div class="catalog-breadcrumb"><a href="#home">Home</a><span>›</span><b>${title}</b></div><div class="catalog-heading ${selected ? 'has-image' : ''}">${selected ? `<img class="catalog-heading-image" src="${categoryOf(selected).image}" alt="" />` : ''}<div><span class="section-kicker">THE NOAH COLLECTION</span><h1>${title}</h1><p>Find your next everyday essential.</p></div><span class="catalog-count" id="catalog-count"></span></div><div class="catalog-controls"><div class="catalog-filters"><select id="filter-brand" aria-label="Brand"><option value="">All brands</option>${brands.map((name) => `<option ${brand === name ? 'selected' : ''}>${name}</option>`).join('')}</select><select id="filter-price" aria-label="Maximum price"><option value="">Any price</option><option value="50000">Under TZS 50,000</option><option value="100000">Under TZS 100,000</option><option value="300000">Under TZS 300,000</option><option value="1000000">Under TZS 1,000,000</option><option value="3000000">Under TZS 3,000,000</option></select><label><input id="filter-stock" type="checkbox" /> In stock</label></div><label class="catalog-sort">Sort <select id="sort-products"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select></label></div><div class="catalog-pills"><button class="${!category ? 'selected' : ''}" data-category-clear>All products</button>${categories.map((item) => `<button class="${category === item.name ? 'selected' : ''}" data-category="${escapeHtml(item.name)}">${categoryThumb(item, 'pill-thumb')}${escapeHtml(item.name)}</button>`).join('')}</div><div class="product-grid" id="catalog-grid"></div></section>`;
  renderCatalogProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCatalogProducts() {
  const grid = $('#catalog-grid');
  if (!grid) return;
  let list = products.filter((item) => (!state.filters.category || item.category === state.filters.category) && (!state.filters.search || `${item.name} ${item.brand} ${item.category}`.toLowerCase().includes(state.filters.search.toLowerCase())) && (!state.filters.brand || item.brand === state.filters.brand) && (!state.filters.maxPrice || item.price <= Number(state.filters.maxPrice)) && (!state.filters.stockOnly || item.stock > 0) && (!state.filters.newOnly || item.isNew) && (!state.filters.dealsOnly || item.oldPrice));
  if (state.filters.sort === 'price-low') list.sort((a, b) => a.price - b.price);
  if (state.filters.sort === 'price-high') list.sort((a, b) => b.price - a.price);
  if (state.filters.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  if (state.filters.sort === 'newest') list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  $('#catalog-count').textContent = `${list.length} products`;
  grid.innerHTML = list.length ? list.map(productCard).join('') : `<div class="no-results"><span>⌕</span><h3>No matching products yet</h3><p>Try changing your search or clearing the filters.</p><button class="section-link" data-clear-filters>Clear filters</button></div>`;
}

function buildHeroStage() {
  const stage = $('#hero-stage');
  if (!stage) return;
  stage.innerHTML = heroSlides.map((slide, i) => `<img class="hero-slide ${i === 0 ? 'active' : ''}" src="${slide.image}" alt="${escapeHtml(slide.caption)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`).join('');
}

function setHero(index) {
  if (!$('.hero')) return;
  state.slide = (index + heroSlides.length) % heroSlides.length;
  const slide = heroSlides[state.slide];
  const hero = $('.hero');
  hero.dataset.tone = slide.tone;
  hero.classList.toggle('banner-slide', Boolean(slide.banner));
  const content = $('.hero-content');
  content.classList.remove('swap'); void content.offsetWidth; content.classList.add('swap');
  $('#hero-kicker').textContent = slide.kicker;
  $('#hero-title').innerHTML = slide.title;
  $('#hero-subtitle').textContent = slide.subtitle;
  $('#hero-caption').textContent = slide.caption;
  $$('.hero-slide').forEach((img, i) => img.classList.toggle('active', i === state.slide));
  $('#hero-number').innerHTML = `0${state.slide + 1} <i>/ 0${heroSlides.length}</i>`;
  $$('.hero-dot').forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === state.slide));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function returnHome() {
  if ($('.catalog-view')) window.location.reload();
}

function setupEvents() {
  buildHeroStage();
  $('#hero-dots').innerHTML = heroSlides.map((_, index) => `<button class="hero-dot ${index === 0 ? 'active' : ''}" aria-label="Show promotion ${index + 1}" data-slide="${index}"></button>`).join('');
  $('#year').textContent = new Date().getFullYear();
  $('.search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const query = $('#site-search').value.trim();
    openCatalog({ search: query });
    $('.search-suggestions').hidden = true;
  });
  $('#site-search').addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const suggestions = $('.search-suggestions');
    if (!query) { suggestions.hidden = true; return; }
    const matches = products.filter((item) => `${item.name} ${item.brand} ${item.category}`.toLowerCase().includes(query)).slice(0, 6);
    suggestions.innerHTML = matches.map((item) => `<button class="search-suggestion" data-product="${item.id}"><img src="${item.image}" alt="" /><span>${escapeHtml(item.name)}</span><small>${money(item.price)}</small></button>`).join('');
    suggestions.hidden = !matches.length;
  });
  $('.hero-next').addEventListener('click', () => setHero(state.slide + 1));
  $('.hero').addEventListener('click', (event) => { const dot = event.target.closest('[data-slide]'); if (dot) setHero(Number(dot.dataset.slide)); });
  $('.bag-trigger').addEventListener('click', openBagDrawer);
  $('.footer-bag').addEventListener('click', openBagDrawer);
  $('.all-categories-button').addEventListener('click', () => {
    const nav = $('.main-navigation');
    const menu = $('.mega-menu');
    if (window.matchMedia('(max-width: 650px)').matches) {
      nav.classList.add('mobile-open');
      menu.hidden = !menu.hidden;
      $('.mobile-menu-toggle').setAttribute('aria-expanded', 'true');
    } else {
      menu.hidden = !menu.hidden;
      $('.all-categories-button').setAttribute('aria-expanded', String(!menu.hidden));
    }
  });
  $('.mobile-menu-toggle').addEventListener('click', () => {
    $('.main-navigation').classList.add('mobile-open');
    $('.mobile-menu-toggle').setAttribute('aria-expanded', 'true');
  });
  $('.mobile-nav-close').addEventListener('click', () => {
    $('.main-navigation').classList.remove('mobile-open');
    $('.mobile-menu-toggle').setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', (event) => {
    const productButton = event.target.closest('[data-product]');
    if (productButton) { openProduct(productButton.dataset.product); return; }
    const addButton = event.target.closest('[data-add]');
    if (addButton) { addToBag(addButton.dataset.add); return; }
    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton) {
      closeLayers();
      $('.main-navigation').classList.remove('mobile-open');
      openCatalog({ category: categoryButton.dataset.category });
      return;
    }
    if (event.target.closest('[data-category-clear]') || event.target.closest('[data-clear-filters]') || event.target.closest('[data-shop-all]')) { openCatalog(); return; }
    if (event.target.closest('[data-shop-deals]')) { openCatalog({ dealsOnly: true }); return; }
    if (event.target.closest('[data-show-new]')) { openCatalog({ newOnly: true }); return; }
    if (event.target.closest('[data-all-categories]')) {
      $('.all-categories-button').click();
      if (window.matchMedia('(max-width: 650px)').matches) $('.main-navigation').classList.add('mobile-open');
      return;
    }
    if (event.target.closest('[data-close]')) { closeLayers(); return; }
    if (event.target.closest('[data-checkout]')) { openCheckout(); return; }
    if (event.target.closest('[data-service-checkout]')) { openCheckout(); return; }
    const quantity = event.target.closest('[data-quantity]');
    if (quantity) {
      const line = state.bag.find((item) => item.productId === quantity.dataset.quantity);
      if (line) {
        line.quantity += Number(quantity.dataset.delta);
        if (line.quantity < 1) state.bag = state.bag.filter((item) => item.productId !== line.productId);
        const product = products.find((item) => item.id === line.productId);
        if (product) line.quantity = Math.min(line.quantity, product.stock);
        renderBagCount(); renderBagDrawer();
      }
      return;
    }
    const remove = event.target.closest('[data-remove]');
    if (remove) { state.bag = state.bag.filter((item) => item.productId !== remove.dataset.remove); renderBagCount(); renderBagDrawer(); return; }
    const brandButton = event.target.closest('[data-brand]');
    if (brandButton) { openCatalog({ brand: brandButton.dataset.brand }); return; }
    const detailAdd = event.target.closest('[data-detail-add]');
    if (detailAdd) { closeLayers(); addToBag(detailAdd.dataset.detailAdd); return; }
    const detailBuy = event.target.closest('[data-detail-buy]');
    if (detailBuy) { closeLayers(); addToBag(detailBuy.dataset.detailBuy); openBagDrawer(); openCheckout(); return; }
    if (event.target.closest('[data-send-order]')) { sendWhatsAppOrder(); return; }
    const galleryDot = event.target.closest('[data-gallery-dot]');
    if (galleryDot) { showGallerySlide(Number(galleryDot.dataset.galleryDot)); startGallery(); showGallerySlide(Number(galleryDot.dataset.galleryDot)); return; }
    const galleryStep = event.target.closest('[data-gallery-step]');
    if (galleryStep) { const next = galleryState.index + Number(galleryStep.dataset.galleryStep); startGallery(); showGallerySlide(next); return; }
  });
  document.addEventListener('submit', (event) => { if (event.target.id === 'checkout-form') completeOrder(event); });
  document.addEventListener('change', (event) => {
    if (event.target.name === 'service' && event.target.form?.id === 'checkout-form') updateServiceSelection($('#checkout-modal'));
    if (event.target.id === 'filter-brand') state.filters.brand = event.target.value;
    if (event.target.id === 'filter-price') state.filters.maxPrice = event.target.value;
    if (event.target.id === 'filter-stock') state.filters.stockOnly = event.target.checked;
    if (event.target.id === 'sort-products') state.filters.sort = event.target.value;
    if (['filter-brand', 'filter-price', 'filter-stock', 'sort-products'].includes(event.target.id)) renderCatalogProducts();
  });
  $('#overlay').addEventListener('click', closeLayers);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeLayers(); $('.mega-menu').hidden = true; $('.main-navigation').classList.remove('mobile-open'); } });
  document.addEventListener('click', (event) => { if (!event.target.closest('.search-form')) $('.search-suggestions').hidden = true; });
  document.querySelectorAll('.navigation-links a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { event.preventDefault(); closeLayers(); $('.main-navigation').classList.remove('mobile-open'); window.location.hash = link.getAttribute('href'); target.scrollIntoView({ behavior: 'smooth' }); }
  }));
  document.addEventListener('click', (event) => {
    const homeLink = event.target.closest('a[href="#home"]');
    if (homeLink && $('.catalog-view')) { event.preventDefault(); window.location.reload(); }
  });
}

renderCategoryMenus();
fillProductSections();
renderBagCount();
setupEvents();
flushQueue();
window.addEventListener('online', flushQueue);
setInterval(flushQueue, 60000);
setInterval(() => { if (!document.hidden) setHero(state.slide + 1); }, 5200);
