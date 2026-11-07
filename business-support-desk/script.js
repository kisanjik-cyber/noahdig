'use strict';

const SERVICE_NAMES = {
  inquiry: 'Product Inquiry and Seller/Shop Price Research',
  research: 'Product Price Research',
  sourcing: 'Product Sourcing and Delivery',
};
const ORDER_STATUSES = ['New Order', 'Pending Payment Verification', 'Payment Verified', 'Confirmed', 'Processing', 'Ready for Delivery', 'Delivered', 'Completed', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Verified', 'Rejected'];
const state = { db: null, activeView: 'overview', reportPeriod: 'day', query: '', toastTimer: 0 };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function money(value) { return `TSh ${Number(value || 0).toLocaleString('en-TZ')}`; }
function dateText(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}
function orderNumber(order) { return order['Order ID'] || ''; }
function statusClass(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function pill(value) { return `<span class="status-pill ${statusClass(value)}">${escapeHtml(value || 'Unknown')}</span>`; }
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status}).`);
  return body;
}
function setView(view) {
  state.activeView = view;
  $$('.view').forEach((section) => section.classList.toggle('active', section.dataset.view === view));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.nav === view));
  const active = $(`.nav-item[data-nav="${view}"]`);
  $('#page-title').textContent = active ? [...active.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('').trim() : 'Overview';
  history.replaceState(null, '', `#${view}`);
  $('#sidebar').classList.remove('open');
  $('.mobile-shade').classList.remove('show');
  if (view === 'database') refreshBackups();
  render();
}
function searchable(order, query) {
  const text = [order['Order ID'], order['Customer Name'], order['Phone Number'], order['Product Name'], order['Selected Service'], order['Payment Reference']].join(' ').toLowerCase();
  return text.includes(query.toLowerCase());
}
function orderButton(order) { return `<button class="order-link" data-open-order="${escapeHtml(orderNumber(order))}">${escapeHtml(orderNumber(order))}</button>`; }
function orderRows(orders, columns) {
  return orders.map((order) => `<tr>${columns(order)}</tr>`).join('') || `<tr><td class="status-empty" colspan="8">No records in this view.</td></tr>`;
}
function visibleOrders() {
  const query = $('#order-search')?.value.trim() || '';
  const sort = $('#order-sort')?.value || 'newest';
  const orders = (state.db?.Orders || []).filter((order) => searchable(order, query));
  orders.sort((a, b) => {
    if (sort === 'oldest') return String(a['Submission Date']).localeCompare(String(b['Submission Date']));
    if (sort === 'fee-high') return Number(b['Service Fee']) - Number(a['Service Fee']);
    return String(b['Submission Date']).localeCompare(String(a['Submission Date']));
  });
  return orders;
}
function statCard(label, value, note, icon, highlight = false) {
  return `<article class="stat-card ${highlight ? 'highlight' : ''}"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><strong>${value}</strong><small>${note}</small></article>`;
}
function renderOverview() {
  const stats = state.db?.stats || {};
  $('#stats-grid').innerHTML = [
    statCard('Total orders received', stats.totalOrders || 0, 'All requests in the workbook', '▤'),
    statCard('Awaiting review', stats.newOrders || 0, 'New and payment-pending', '◷', true),
    statCard('Verified service fees', money(stats.feesCollected), 'Service fee payments only', 'TSh'),
    statCard('Outstanding product amount', money(stats.outstanding), 'Product balance, separate from fees', '↗'),
    statCard('Confirmed orders', stats.confirmedOrders || 0, 'Ready for processing', '✓'),
    statCard('Completed orders', stats.completedOrders || 0, 'Closed requests', '□'),
    statCard('Cancelled orders', stats.cancelledOrders || 0, 'Retained in order history', '×'),
    statCard('Customer records', stats.customers || 0, 'Deduplicated by phone', '♙'),
  ].join('');
  const latest = [...(state.db?.Orders || [])].sort((a, b) => String(b['Submission Date']).localeCompare(String(a['Submission Date']))).slice(0, 7);
  $('#recent-orders').innerHTML = orderRows(latest, (order) => `<td>${orderButton(order)}<small class="muted-cell">${escapeHtml(dateText(order['Submission Date']))}</small></td><td><div class="primary-cell"><b>${escapeHtml(order['Customer Name'])}</b><small>${escapeHtml(order['Phone Number'])}</small></div></td><td>${escapeHtml(order['Selected Service'])}</td><td>${money(order['Service Fee'])}</td><td>${pill(order['Payment Status'])}</td><td>${pill(order['Order Status'])}</td><td><button class="mini-action" data-open-order="${escapeHtml(orderNumber(order))}">Open</button></td>`);
  const waiting = (state.db?.Orders || []).filter((order) => order['Payment Status'] === 'Pending').slice(0, 4);
  $('#pending-payment-list').innerHTML = waiting.length ? waiting.map((order) => `<div class="compact-row"><div><b>${escapeHtml(order['Customer Name'])}</b><small>${escapeHtml(order['Payment Reference'])} · ${escapeHtml(order['Order ID'])}</small></div><span class="fee">${money(order['Service Fee'])}</span></div>`).join('') : '<p class="panel-copy">No payment references are waiting for review.</p>';
  const counts = Object.values(SERVICE_NAMES).map((name) => ({ name, count: (state.db?.Orders || []).filter((order) => order['Selected Service'] === name).length }));
  const maximum = Math.max(1, ...counts.map((item) => item.count));
  $('#service-chart').innerHTML = counts.map((item) => `<div class="chart-row"><span>${escapeHtml(item.name)}</span><div class="chart-track"><div class="chart-fill" style="width:${Math.round(item.count / maximum * 100)}%"></div></div><b>${item.count}</b></div>`).join('');
}
function renderOrders() {
  const orders = visibleOrders();
  $('#new-order-rows').innerHTML = orderRows(orders.filter((order) => ['New Order', 'Pending Payment Verification'].includes(order['Order Status'])), (order) => `<td>${orderButton(order)}<small class="muted-cell">${escapeHtml(dateText(order['Submission Date']))}</small></td><td><div class="primary-cell"><b>${escapeHtml(order['Customer Name'])}</b><small>${escapeHtml(order['Phone Number'])}</small></div></td><td>${escapeHtml(order['Product Name'])}</td><td>${escapeHtml(order['Selected Service'])}</td><td>${money(order['Service Fee'])}</td><td>${pill(order['Payment Status'])}</td><td>${pill(order['Order Status'])}</td><td><button class="mini-action" data-open-order="${escapeHtml(orderNumber(order))}">Review</button></td>`);
  const grouped = {
    confirmed: orders.filter((order) => ['Confirmed', 'Processing', 'Ready for Delivery'].includes(order['Order Status'])),
    pending: orders.filter((order) => !['Confirmed', 'Processing', 'Ready for Delivery', 'Delivered', 'Completed', 'Cancelled'].includes(order['Order Status'])),
    completed: orders.filter((order) => order['Order Status'] === 'Completed'),
    cancelled: orders.filter((order) => order['Order Status'] === 'Cancelled'),
  };
  $('#confirmed-rows').innerHTML = orderRows(grouped.confirmed, (order) => `<td>${orderButton(order)}</td><td>${escapeHtml(order['Customer Name'])}<small class="muted-cell">${escapeHtml(order['Phone Number'])}</small></td><td>${escapeHtml(order['Product Name'])}</td><td>${escapeHtml(dateText(order['Confirmation Date']))}</td><td>${pill(order['Payment Status'])}</td><td>${pill(order['Order Status'])}</td><td class="row-actions"><button class="mini-action" data-open-order="${escapeHtml(orderNumber(order))}">Open</button> <a class="wa-mini" href="${whatsappForOrder(order)}" target="_blank" rel="noopener noreferrer">WhatsApp</a></td>`);
  $('#pending-rows').innerHTML = orderRows(grouped.pending, (order) => `<td>${orderButton(order)}</td><td>${escapeHtml(order['Customer Name'])}</td><td>${escapeHtml(order['Selected Service'])}</td><td>${escapeHtml(order['Payment Reference'])}</td><td>${pill(order['Payment Status'])}</td><td>${pill(order['Order Status'])}</td><td><button class="mini-action" data-open-order="${escapeHtml(orderNumber(order))}">Review</button></td>`);
  $('#completed-rows').innerHTML = orderRows(grouped.completed, (order) => `<td>${orderButton(order)}</td><td>${escapeHtml(order['Customer Name'])}</td><td>${escapeHtml(order['Product Name'])}</td><td>${money(order['Service Fee'])}</td><td>${escapeHtml(dateText(order['Completion Date']))}</td><td>${escapeHtml(order['Receipt Number'])}</td><td><button class="mini-action" data-receipt="${escapeHtml(orderNumber(order))}">PDF</button></td>`);
  $('#cancelled-rows').innerHTML = orderRows(grouped.cancelled, (order) => `<td>${orderButton(order)}</td><td>${escapeHtml(order['Customer Name'])}</td><td>${escapeHtml(order['Selected Service'])}</td><td>${pill(order['Payment Status'])}</td><td>${escapeHtml(dateText(order['Submission Date']))}</td><td><button class="mini-action" data-open-order="${escapeHtml(orderNumber(order))}">Open</button></td>`);
}
function renderCustomers() {
  const query = $('#customer-search')?.value.trim().toLowerCase() || '';
  const rows = (state.db?.Customers || []).filter((customer) => `${customer['Full Name']} ${customer['Phone Number']} ${customer.Email}`.toLowerCase().includes(query));
  $('#customer-rows').innerHTML = rows.map((customer) => `<tr><td><div class="primary-cell"><b>${escapeHtml(customer['Full Name'])}</b><small>${escapeHtml(customer['Customer ID'])}</small></div></td><td>${escapeHtml(customer['Phone Number'])}</td><td>${escapeHtml(customer.Email || '—')}</td><td>${Number(customer['Order Count'] || 0)}</td><td>${escapeHtml(dateText(customer['Last Order']))}</td></tr>`).join('') || '<tr><td colspan="5" class="status-empty">No matching customers.</td></tr>';
}
function renderPayments() {
  const query = $('#payment-search')?.value.trim().toLowerCase() || '';
  const payments = (state.db?.Payments || []).filter((payment) => `${payment['Order ID']} ${payment['Payment Reference']} ${payment['Verified By']}`.toLowerCase().includes(query));
  $('#payment-rows').innerHTML = payments.map((payment) => {
    const order = state.db.Orders.find((item) => item['Order ID'] === payment['Order ID']) || {};
    return `<tr><td><div class="primary-cell"><b>${escapeHtml(order['Customer Name'] || 'Unknown customer')}</b><small>${orderButton(order)}</small></div></td><td><b>${escapeHtml(payment['Payment Reference'])}</b><small class="muted-cell">TIPS ${escapeHtml(payment['TIPS Number'])}</small></td><td>${escapeHtml(payment['Payment Method'])}</td><td>${money(payment['Service Fee'])}</td><td>${money(order['Outstanding Product Balance'])}</td><td>${pill(payment['Verification Status'])}</td><td>${payment['Verification Status'] === 'Pending' ? `<button class="mini-action" data-open-order="${escapeHtml(orderNumber(order))}">Verify</button>` : `<button class="mini-action" data-open-order="${escapeHtml(orderNumber(order))}">Review</button>`}</td></tr>`;
  }).join('') || '<tr><td colspan="7" class="status-empty">No payment records found.</td></tr>';
}
function renderReceipts() {
  $('#receipt-rows').innerHTML = (state.db?.Receipts || []).map((receipt) => `<tr><td><b>${escapeHtml(receipt['Receipt Number'])}</b></td><td>${orderButton({ 'Order ID': receipt['Order ID'] })}</td><td>${escapeHtml(receipt['Customer Name'])}<small class="muted-cell">${escapeHtml(receipt['Phone Number'])}</small></td><td>${money(receipt['Service Fee'])}</td><td>${pill(receipt['Payment Status'])}</td><td>${escapeHtml(dateText(receipt['Receipt Date']))}</td><td><button class="mini-action" data-receipt="${escapeHtml(receipt['Order ID'])}">Download / reprint</button></td></tr>`).join('') || '<tr><td colspan="7" class="status-empty">No receipts yet.</td></tr>';
}
function getPeriodRange(period) {
  const now = new Date();
  const start = new Date(now);
  if (period === 'day') start.setHours(0, 0, 0, 0);
  if (period === 'week') { start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); }
  if (period === 'month') { start.setHours(0, 0, 0, 0); start.setDate(1); }
  if (period === 'year') { start.setHours(0, 0, 0, 0); start.setMonth(0, 1); }
  return { start, end: now };
}
function renderReports() {
  const range = getPeriodRange(state.reportPeriod);
  const orders = (state.db?.Orders || []).filter((order) => { const date = new Date(order['Submission Date']); return !Number.isNaN(date.getTime()) && date >= range.start && date <= range.end; });
  const verified = orders.filter((order) => order['Payment Status'] === 'Verified');
  const pending = orders.filter((order) => order['Payment Status'] === 'Pending');
  $('#report-stats').innerHTML = [
    statCard('Orders in period', orders.length, `${range.start.toLocaleDateString()} – today`, '▤'),
    statCard('Verified service fees', money(verified.reduce((sum, order) => sum + Number(order['Service Fee']), 0)), 'Service fees, verified only', 'TSh'),
    statCard('Pending service fees', money(pending.reduce((sum, order) => sum + Number(order['Service Fee']), 0)), 'Awaiting manual review', '◷'),
    statCard('Product balance outstanding', money(orders.reduce((sum, order) => sum + Number(order['Outstanding Product Balance'] || 0), 0)), 'Tracked separately', '↗'),
  ].join('');
  const rows = (state.db?.Reports || []).filter((row) => row.Period.startsWith({ day: 'Day ', week: 'Week ', month: 'Month ', year: 'Year ' }[state.reportPeriod])).slice(-18).reverse();
  $('#report-rows').innerHTML = rows.map((row) => `<tr><td>${escapeHtml(row.Period)} <small class="muted-cell">${escapeHtml(row['Period Start'])} – ${escapeHtml(row['Period End'])}</small></td><td>${row.Orders}</td><td>${money(row['Verified Service Fees'])}</td><td>${money(row['Pending Service Fees'])}</td><td>${money(row['Outstanding Product Payments'])}</td><td>${row['Completed Orders']}</td></tr>`).join('') || '<tr><td colspan="6" class="status-empty">Report periods will populate as orders arrive.</td></tr>';
}
function render() {
  if (!state.db) return;
  renderOverview(); renderOrders(); renderCustomers(); renderPayments(); renderReceipts(); renderReports();
  const pendingPayments = state.db.Payments.filter((payment) => payment['Verification Status'] === 'Pending').length;
  $$('[data-nav-count="newOrders"]').forEach((element) => { element.textContent = state.db.stats?.newOrders || 0; });
  $$('[data-nav-count="pendingPayments"]').forEach((element) => { element.textContent = pendingPayments; });
  $('#db-status').textContent = `${state.db.database} · saved locally`;
  $('#database-name').textContent = state.db.database;
  $('#settings-database').textContent = state.db.database;
  $('#database-location').textContent = 'Windows local application data folder · data';
  $('#connection-time').textContent = new Date().toLocaleTimeString();
}
async function loadData() {
  const data = await api('/api/data');
  state.db = data;
  render();
}
function openOrder(orderId) {
  const order = state.db.Orders.find((item) => item['Order ID'] === orderId);
  if (!order) return;
  $('#dialog-title').textContent = order['Order ID'];
  const payment = state.db.Payments.find((item) => item['Order ID'] === orderId) || {};
  const waUrl = order['Confirmation Date'] && order['Order Status'] !== 'Cancelled' ? whatsappForOrder(order) : '';
  const canConfirm = order['Payment Status'] === 'Verified' && !order['Confirmation Date'] && order['Order Status'] !== 'Cancelled';
  const waBanner = waUrl ? `<div class="wa-banner"><div><b>✓ Payment verified · order confirmed</b><small>Tell ${escapeHtml(order['Customer Name'])} (${escapeHtml(order['Phone Number'])}) on WhatsApp that the order is received.</small></div><a class="wa-button" href="${waUrl}" target="_blank" rel="noopener noreferrer">Tuma WhatsApp kwa mteja</a></div>` : '';
  $('#order-detail').innerHTML = `${waBanner}<div class="detail-grid"><section class="detail-section"><h3>Customer & request</h3><dl class="detail-list"><dt>Customer</dt><dd>${escapeHtml(order['Customer Name'])}</dd><dt>Phone</dt><dd>${escapeHtml(order['Phone Number'])}</dd><dt>Address</dt><dd>${escapeHtml(order['Delivery Address'] || 'Not provided')}</dd><dt>Product</dt><dd>${escapeHtml(order['Product Name'])}</dd><dt>Requirements</dt><dd>${escapeHtml(order['Product Description'])}</dd><dt>Service</dt><dd>${escapeHtml(order['Selected Service'])}</dd><dt>Submitted</dt><dd>${escapeHtml(dateText(order['Submission Date']))}</dd><dt>Receipt</dt><dd>${escapeHtml(order['Receipt Number'])}</dd></dl></section><section class="detail-section"><h3>Payment breakdown</h3><dl class="detail-list"><dt>Service fee</dt><dd>${money(order['Service Fee'])} · prepaid</dd><dt>Reference</dt><dd>${escapeHtml(payment['Payment Reference'] || order['Payment Reference'])}</dd><dt>Method / TIPS</dt><dd>${escapeHtml(payment['Payment Method'] || order['Payment Method'])} · ${escapeHtml(order['TIPS Number'])}</dd><dt>Verification</dt><dd>${pill(order['Payment Status'])}</dd><dt>Actual product</dt><dd>${money(order['Actual Product Price'])}</dd><dt>Product balance</dt><dd>${order['Pay on Delivery'] === 'Yes' ? `${money(order['Outstanding Product Balance'])} · pay on delivery` : money(order['Outstanding Product Balance'])}</dd><dt>Order status</dt><dd>${pill(order['Order Status'])}</dd><dt>Confirmed</dt><dd>${escapeHtml(dateText(order['Confirmation Date']))}</dd></dl></section></div><form class="dialog-controls" id="order-update-form" data-order-id="${escapeHtml(orderId)}"><div class="control-row"><label>Payment verification<select name="paymentStatus">${PAYMENT_STATUSES.map((status) => `<option ${status === order['Payment Status'] ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label>Order status<select name="orderStatus">${ORDER_STATUSES.map((status) => `<option ${status === order['Order Status'] ? 'selected' : ''}>${status}</option>`).join('')}</select></label></div><label>Actual product price (TSh)<input name="actualProductPrice" type="number" min="0" step="1" value="${Number(order['Actual Product Price'] || 0)}" /></label><div class="dialog-actions"><button class="primary-button" type="submit">Save changes <span>→</span></button><button class="outline-button" type="button" data-receipt="${escapeHtml(orderId)}">Download receipt <span>↓</span></button>${waUrl ? `<a class="wa-button" href="${waUrl}" target="_blank" rel="noopener noreferrer">WhatsApp customer <span>↗</span></a>` : ''}<button class="danger-button" type="button" data-cancel-order="${escapeHtml(orderId)}">Cancel order</button></div><p class="form-error" id="order-error"></p></form>`;
  if (!waUrl && !canConfirm && order['Order Status'] !== 'Cancelled' && order['Payment Status'] !== 'Verified') {
    const verifyButton = document.createElement('button');
    verifyButton.type = 'button';
    verifyButton.className = 'primary-button';
    verifyButton.dataset.verifyConfirm = orderId;
    verifyButton.textContent = 'Verify payment & confirm';
    $('#order-detail .dialog-actions').prepend(verifyButton);
  }
  if (canConfirm) {
    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'primary-button';
    confirmButton.dataset.confirmOrder = orderId;
    confirmButton.textContent = 'Confirm order';
    $('#order-detail .dialog-actions').prepend(confirmButton);
  }
  $('#order-modal').hidden = false;
}
function whatsappForOrder(order) {
  let digits = String(order['Phone Number'] || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `255${digits.slice(1)}`;
  if (!digits.startsWith('255') && digits.length === 9) digits = `255${digits}`;
  const name = order['Customer Name'];
  const text = `Habari ${name},\n\nMalipo yako yamethibitishwa na oda yako imepokelewa na kuthibitishwa na NOAH Digital Store. \u2705\n\nNamba ya Oda: ${order['Order ID']}\nHuduma: ${order['Selected Service']}\nBidhaa: ${order['Product Name']}\nHali ya Malipo: Yamethibitishwa\nHali ya Oda: ${order['Order Status'] === 'Confirmed' ? 'Imethibitishwa' : order['Order Status']}\n\nTutakujulisha kila hatua ya oda yako. Asante kwa kuchagua NOAH Digital Store!\n\n---\nHello ${name}, your payment has been verified and your order ${order['Order ID']} has been received and confirmed. We will keep you updated.\n\nNOAH Digital Store – Your Trusted Digital Shopping Partner.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
async function updateOrder(event) {
  event.preventDefault();
  const form = event.target;
  const values = new FormData(form);
  const orderId = form.dataset.orderId;
  const currentOrder = state.db.Orders.find((order) => order['Order ID'] === orderId);
  const error = $('#order-error');
  error.textContent = '';
  try {
    const update = { actualProductPrice: values.get('actualProductPrice') };
    if (values.get('orderStatus') !== currentOrder['Order Status']) update.orderStatus = values.get('orderStatus');
    if (values.get('paymentStatus') !== currentOrder['Payment Status']) update.paymentStatus = values.get('paymentStatus');
    await api(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify(update) });
    await loadData();
    openOrder(orderId);
    showToast('Order and Excel records updated.');
  } catch (issue) { error.textContent = issue.message; }
}
async function cancelOrder(orderId) {
  if (!confirm('Cancel this order? The record will remain in the database.')) return;
  try { await api(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ orderStatus: 'Cancelled' }) }); await loadData(); $('#order-modal').hidden = true; showToast('Order cancelled and recorded.'); }
  catch (error) { showToast(error.message); }
}
async function confirmOrder(orderId, verifyPayment = false) {
  if (verifyPayment) {
    const order = state.db.Orders.find((item) => item['Order ID'] === orderId);
    if (!confirm(`Have you checked that the TIPS payment (reference ${order?.['Payment Reference'] || ''}) was received?\n\nPress OK to mark payment as Verified and confirm the order.`)) return;
  }
  try {
    const body = verifyPayment ? { paymentStatus: 'Verified', orderStatus: 'Confirmed' } : { orderStatus: 'Confirmed' };
    await api(`/api/orders/${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify(body) });
    await loadData();
    openOrder(orderId);
    showToast('Order confirmed. Press "Tuma WhatsApp kwa mteja" to notify the customer.');
  } catch (error) { showToast(error.message); }
}
function downloadReceipt(orderId) { window.open(`/api/orders/${encodeURIComponent(orderId)}/receipt.pdf`, '_blank', 'noopener'); }
async function refreshBackups() {
  try {
    const data = await api('/api/backups');
    $('#backup-list').innerHTML = data.files.map((file) => `<div class="backup-row"><span>${escapeHtml(file)}</span><a href="/api/backups/${encodeURIComponent(file)}">Download</a></div>`).join('') || '<div class="status-empty">No backups have been created yet. A backup is made before the first database change.</div>';
  } catch (error) { $('#backup-list').textContent = error.message; }
}
function addRestoreControl() {
  const backups = $('#backup-list');
  if (!backups || $('#restore-form')) return;
  const form = document.createElement('form');
  form.id = 'restore-form';
  form.className = 'upload-form restore-form';
  form.innerHTML = '<label class="file-picker"><span>Choose backup workbook</span><input type="file" name="backup" accept=".xlsx" required /></label><button class="outline-button" type="submit">Restore backup</button><p class="form-error" id="restore-error"></p>';
  backups.after(form);
}
async function restoreBackup(event) {
  event.preventDefault();
  const file = event.target.querySelector('[name="backup"]').files[0];
  if (!file || !confirm('Restore this workbook as the primary database? A backup of the current workbook will be kept first.')) return;
  const body = new FormData(); body.append('backup', file);
  try { await api('/api/backups/restore', { method: 'POST', body }); await loadData(); event.target.reset(); showToast('Database restored from backup.'); }
  catch (error) { $('#restore-error').textContent = error.message; }
}
async function initialize() {
  $('#today-date').textContent = new Date().toLocaleDateString('en-TZ', { dateStyle: 'medium' });
  $('#overview-date').textContent = new Date().toLocaleDateString('en-TZ', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase();
  $('#sign-out').hidden = true;
  addRestoreControl();
  document.addEventListener('click', async (event) => {
    const nav = event.target.closest('[data-nav]');
    if (nav) { event.preventDefault(); setView(nav.dataset.nav); return; }
    const order = event.target.closest('[data-open-order]');
    if (order) { openOrder(order.dataset.openOrder); return; }
    const receipt = event.target.closest('[data-receipt]');
    if (receipt) { downloadReceipt(receipt.dataset.receipt); return; }
    const cancel = event.target.closest('[data-cancel-order]');
    if (cancel) { await cancelOrder(cancel.dataset.cancelOrder); return; }
    const confirmButton = event.target.closest('[data-confirm-order]');
    if (confirmButton) { await confirmOrder(confirmButton.dataset.confirmOrder); return; }
    const verifyButton = event.target.closest('[data-verify-confirm]');
    if (verifyButton) { await confirmOrder(verifyButton.dataset.verifyConfirm, true); return; }
    if (event.target.closest('[data-close-dialog]') || event.target === $('#order-modal')) $('#order-modal').hidden = true;
  });
  document.addEventListener('submit', (event) => {
    if (event.target.id === 'order-update-form') updateOrder(event);
    if (event.target.id === 'import-form') importDatabase(event);
    if (event.target.id === 'restore-form') restoreBackup(event);
  });
  $('#order-search').addEventListener('input', renderOrders);
  $('#order-sort').addEventListener('change', renderOrders);
  $('#customer-search').addEventListener('input', renderCustomers);
  $('#payment-search').addEventListener('input', renderPayments);
  $('#refresh-data').addEventListener('click', async () => { try { await loadData(); showToast('Workbook refreshed.'); } catch (error) { showToast(error.message); } });
  $('#refresh-backups').addEventListener('click', refreshBackups);
  $('#sign-out').addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); location.reload(); });
  $('#mobile-menu').addEventListener('click', () => { $('#sidebar').classList.toggle('open'); $('.mobile-shade').classList.toggle('show'); });
  $('.mobile-shade').addEventListener('click', () => { $('#sidebar').classList.remove('open'); $('.mobile-shade').classList.remove('show'); });
  $$('.period-tab').forEach((button) => button.addEventListener('click', () => { state.reportPeriod = button.dataset.period; $$('.period-tab').forEach((tab) => tab.classList.toggle('active', tab === button)); renderReports(); }));
  try { await loadData(); }
  catch (error) { showToast(`Business Desk could not load: ${error.message}`); }
  window.setInterval(async () => {
    if (!document.hidden && state.db) {
      try { await loadData(); } catch (error) { console.warn('Automatic workbook refresh failed:', error.message); }
    }
  }, 20000);
  const initialView = location.hash.slice(1);
  if (initialView && $(`[data-view="${initialView}"]`)) setView(initialView);
}
async function importDatabase(event) {
  event.preventDefault();
  const form = event.target;
  const file = form.querySelector('[name="database"]').files[0];
  const message = $('#import-error');
  message.textContent = '';
  if (!file) return;
  const body = new FormData(); body.append('database', file);
  try { await api('/api/import', { method: 'POST', body }); await loadData(); form.reset(); showToast('Database validated and merged.'); }
  catch (error) { message.textContent = error.message; }
}
initialize();
