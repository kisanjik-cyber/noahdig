'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const ROOT = __dirname;
const DATA_DIR = path.resolve(process.env.NOAH_DATA_DIR || path.join(ROOT, 'data'));
const DATABASE_PATH = path.join(DATA_DIR, 'NOAH_DIGITAL_STORE_DATABASE.xlsx');
const TEMPLATE_PATH = path.join(ROOT, 'NOAH_DIGITAL_STORE_DATABASE.xlsx');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const PORT = Number(process.env.PORT || 4177);
const HOST = process.env.HOST || '127.0.0.1';
const ADMIN_PASSWORD = process.env.NOAH_ADMIN_PASSWORD || '';
const LOGIN_REQUIRED = process.env.NOAH_LOGIN_REQUIRED === 'true' && ADMIN_PASSWORD.length >= 12;
const TIPS_NUMBER = '251268047';
const SERVICES = {
  inquiry: { name: 'Product Inquiry and Seller/Shop Price Research', fee: 1000 },
  research: { name: 'Product Price Research', fee: 2000 },
  sourcing: { name: 'Product Sourcing and Delivery', fee: 5000 },
};
const STATUSES = ['New Order', 'Pending Payment Verification', 'Payment Verified', 'Confirmed', 'Processing', 'Ready for Delivery', 'Delivered', 'Completed', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Verified', 'Rejected'];
const HEADERS = {
  Customers: ['Customer ID', 'Full Name', 'Phone Number', 'Email', 'Delivery Address', 'Order Count', 'First Order', 'Last Order'],
  Orders: ['Order ID', 'Customer ID', 'Customer Name', 'Phone Number', 'Product Name', 'Product Description', 'Service ID', 'Selected Service', 'Service Fee', 'Actual Product Price', 'Outstanding Product Balance', 'Total Amount', 'Payment Reference', 'Payment Status', 'Payment Method', 'TIPS Number', 'Pay on Delivery', 'Order Status', 'Submission Date', 'Confirmation Date', 'Completion Date', 'Receipt Number', 'Delivery Address', 'Source'],
  Payments: ['Payment ID', 'Order ID', 'Payment Reference', 'TIPS Number', 'Service Fee', 'Payment Amount', 'Payment Method', 'Verification Status', 'Payment Date', 'Verified Date', 'Verified By', 'Notes'],
  Products: ['Product ID', 'Order ID', 'Product Name', 'Description', 'Actual Price', 'Sourcing Information'],
  Receipts: ['Receipt Number', 'Order ID', 'Customer Name', 'Phone Number', 'Selected Service', 'Service Fee', 'Actual Product Price', 'Outstanding Product Balance', 'Payment Method', 'TIPS Number', 'Transaction Reference', 'Payment Status', 'Receipt Date', 'Pay on Delivery'],
  'Order Tracking': ['Tracking ID', 'Order ID', 'Status', 'Update Date', 'Notes', 'Updated By'],
  Settings: ['Setting', 'Value'],
  Reports: ['Period', 'Period Start', 'Period End', 'Orders', 'Verified Service Fees', 'Pending Service Fees', 'Outstanding Product Payments', 'Completed Orders', 'Cancelled Orders', 'Generated At'],
};
const KEYS = {
  Customers: 'Customer ID', Orders: 'Order ID', Payments: 'Payment ID', Products: 'Product ID', Receipts: 'Receipt Number', 'Order Tracking': 'Tracking ID', Settings: 'Setting', Reports: 'Period',
};
const sessions = new Map();
const limits = new Map();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1 } });

function dateNow() { return new Date().toISOString(); }
function id(prefix) { return `${prefix}-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; }
function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `255${digits.slice(1)}`;
  if (digits.startsWith('255')) return `+${digits}`;
  if (digits.length === 9) return `+255${digits}`;
  return digits ? `+${digits}` : '';
}
function escapeSpreadsheet(value) {
  return value ?? '';
}
function makeDefaultDatabase() {
  const settings = [
    { Setting: 'Business Name', Value: 'NOAH Digital Store' },
    { Setting: 'TIPS Number', Value: TIPS_NUMBER },
    { Setting: 'Service Categories', Value: JSON.stringify(SERVICES) },
    { Setting: 'Order Statuses', Value: JSON.stringify(STATUSES) },
    { Setting: 'Last Backup', Value: '' },
  ];
  return { Customers: [], Orders: [], Payments: [], Products: [], Receipts: [], 'Order Tracking': [], Settings: settings, Reports: [] };
}
function recordsFromSheet(sheet, sheetName) {
  const headerRow = sheet.getRow(1);
  const headers = headerRow.values.slice(1).map((value) => String(value ?? '').trim());
  if (HEADERS[sheetName].some((header) => !headers.includes(header))) throw new Error(`The ${sheetName} sheet is missing required columns.`);
  const records = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record = {};
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      if (cell.type === ExcelJS.ValueType.Formula || cell.type === ExcelJS.ValueType.Hyperlink) throw new Error(`Formula or hyperlink detected in ${sheetName}, row ${rowNumber}.`);
      const value = cell.value;
      record[header] = value instanceof Date ? value.toISOString() : (value && typeof value === 'object' && 'text' in value ? value.text : value ?? '');
    });
    if (Object.values(record).some((value) => value !== '')) records.push(record);
  });
  return records;
}
async function readWorkbook(filePath = DATABASE_PATH) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const db = {};
  for (const [sheetName, columns] of Object.entries(HEADERS)) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) throw new Error(`Database workbook is missing the '${sheetName}' worksheet.`);
    db[sheetName] = recordsFromSheet(sheet, sheetName);
    if (columns.some((column) => !sheet.getRow(1).values.slice(1).map(String).includes(column))) throw new Error(`The ${sheetName} sheet has an invalid header row.`);
  }
  return db;
}
function styleSheet(sheet) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${columnName(sheet.columnCount)}1` };
  sheet.getRow(1).height = 30;
  sheet.getRow(1).font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4D2B6D' } };
  sheet.getRow(1).alignment = { vertical: 'middle', wrapText: true };
  sheet.columns.forEach((column) => { column.width = Math.min(Math.max(String(column.header || '').length + 4, 17), 34); });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'top', wrapText: true };
      if (rowNumber % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F5F9' } };
    }
  });
}
function columnName(number) {
  let result = '';
  while (number > 0) { const rem = (number - 1) % 26; result = String.fromCharCode(65 + rem) + result; number = Math.floor((number - 1) / 26); }
  return result || 'A';
}
function reportRows(db) {
  const periods = new Map();
  const add = (period, start, end, predicate) => {
    const orders = db.Orders.filter(predicate);
    const verified = orders.filter((order) => order['Payment Status'] === 'Verified');
    periods.set(period, {
      Period: period, 'Period Start': start, 'Period End': end, Orders: orders.length,
      'Verified Service Fees': verified.reduce((sum, order) => sum + Number(order['Service Fee'] || 0), 0),
      'Pending Service Fees': orders.filter((order) => order['Payment Status'] === 'Pending').reduce((sum, order) => sum + Number(order['Service Fee'] || 0), 0),
      'Outstanding Product Payments': orders.reduce((sum, order) => sum + Number(order['Outstanding Product Balance'] || 0), 0),
      'Completed Orders': orders.filter((order) => order['Order Status'] === 'Completed').length,
      'Cancelled Orders': orders.filter((order) => order['Order Status'] === 'Cancelled').length,
      'Generated At': dateNow(),
    });
  };
  const yearNow = new Date().getUTCFullYear();
  for (let year = yearNow - 4; year <= yearNow; year += 1) {
    add(`Year ${year}`, `${year}-01-01`, `${year}-12-31`, (order) => String(order['Submission Date']).startsWith(String(year)));
    for (let month = 1; month <= 12; month += 1) {
      const monthString = String(month).padStart(2, '0');
      const prefix = `${year}-${monthString}`;
      add(`Month ${prefix}`, `${prefix}-01`, `${prefix}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`, (order) => String(order['Submission Date']).startsWith(prefix));
    }
  }
  const today = new Date();
  const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  for (let delta = 0; delta < 28; delta += 7) {
    const start = new Date(startOfDay); start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7) - delta);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6);
    const startText = start.toISOString().slice(0, 10); const endText = end.toISOString().slice(0, 10);
    add(`Week ${startText}`, startText, endText, (order) => { const day = String(order['Submission Date']).slice(0, 10); return day >= startText && day <= endText; });
  }
  const todayText = today.toISOString().slice(0, 10);
  add(`Day ${todayText}`, todayText, todayText, (order) => String(order['Submission Date']).startsWith(todayText));
  return [...periods.values()];
}
function buildWorkbook(db) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NOAH Digital Store';
  workbook.subject = 'Local order, customer and payment database';
  workbook.created = new Date();
  const reportData = { ...db, Reports: reportRows(db) };
  for (const [name, columns] of Object.entries(HEADERS)) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(columns);
    for (const record of reportData[name] || []) sheet.addRow(columns.map((column) => escapeSpreadsheet(record[column])));
    styleSheet(sheet);
  }
  return workbook;
}
async function backupDatabase() {
  await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(DATABASE_PATH)) return;
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  await fs.promises.copyFile(DATABASE_PATH, path.join(BACKUP_DIR, `NOAH_DATABASE_${stamp}.xlsx`));
  const backups = (await fs.promises.readdir(BACKUP_DIR)).filter((file) => file.endsWith('.xlsx')).sort().reverse();
  await Promise.all(backups.slice(50).map((file) => fs.promises.unlink(path.join(BACKUP_DIR, file))));
}
async function saveDatabase(db, backup = true) {
  if (backup) await backupDatabase();
  const workbook = buildWorkbook(db);
  const temporary = `${DATABASE_PATH}.${crypto.randomUUID()}.tmp`;
  await workbook.xlsx.writeFile(temporary);
  await fs.promises.rename(temporary, DATABASE_PATH);
}
async function initializeDatabase() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(TEMPLATE_PATH)) await buildWorkbook(makeDefaultDatabase()).xlsx.writeFile(TEMPLATE_PATH);
  if (!fs.existsSync(DATABASE_PATH)) await fs.promises.copyFile(TEMPLATE_PATH, DATABASE_PATH);
  await readWorkbook();
}
function recordsMap(records, key) { return new Map(records.map((record) => [String(record[key]), record])); }
function mergeSheet(existing, imported, key) {
  const combined = recordsMap(existing, key);
  for (const record of imported) combined.set(String(record[key]), record);
  return [...combined.values()];
}
function audit(db, action, orderId, details, actor = 'System') {
  db['Order Tracking'].push({ 'Tracking ID': id('ACT'), 'Order ID': orderId || '', Status: action, 'Update Date': dateNow(), Notes: details, 'Updated By': actor });
}
function customerUpsert(db, input) {
  const phone = normalizePhone(input.phone);
  const key = phone || String(input.customerName).trim().toLowerCase();
  let customer = db.Customers.find((record) => (phone && normalizePhone(record['Phone Number']) === phone) || (!phone && record['Customer ID'] === key));
  if (!customer) {
    customer = { 'Customer ID': id('CUS'), 'Full Name': input.customerName, 'Phone Number': phone, Email: input.email || '', 'Delivery Address': input.deliveryAddress || '', 'Order Count': 0, 'First Order': dateNow(), 'Last Order': dateNow() };
    db.Customers.push(customer);
  }
  customer['Full Name'] = input.customerName;
  customer['Phone Number'] = phone;
  customer.Email = input.email || customer.Email || '';
  customer['Delivery Address'] = input.deliveryAddress || customer['Delivery Address'] || '';
  customer['Order Count'] = Number(customer['Order Count'] || 0) + 1;
  customer['Last Order'] = dateNow();
  return customer;
}
function validateIncoming(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Order payload must be a JSON object.');
  const service = SERVICES[String(body.serviceId || '')];
  if (!service) throw new Error('Select one of the configured services.');
  const serviceFee = Number(body.serviceFee);
  if (serviceFee !== service.fee) throw new Error('The service fee does not match the selected service.');
  const required = ['customerName', 'phone', 'productName', 'productDescription', 'paymentReference', 'orderId'];
  for (const field of required) {
    if (typeof body[field] !== 'string' || body[field].trim().length < 2 || body[field].trim().length > 1500) throw new Error(`A valid ${field} is required.`);
  }
  if (body.paymentReference.trim().length > 80) throw new Error('Payment reference is too long.');
  const digits = String(body.phone).replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) throw new Error('Enter a valid phone number.');
  if (body.tipsNumber && String(body.tipsNumber) !== TIPS_NUMBER) throw new Error('The TIPS number does not match NOAH settings.');
  const actualPrice = Number(body.actualProductPrice || 0);
  if (!Number.isFinite(actualPrice) || actualPrice < 0 || actualPrice > 1000000000) throw new Error('Actual product price must be a valid non-negative amount.');
  const payOnDelivery = body.payOnDelivery === true || body.payOnDelivery === 'Yes';
  if (payOnDelivery && body.serviceId !== 'sourcing') throw new Error('Pay on Delivery is only available for Product Sourcing and Delivery.');
  return { ...body, service, serviceFee, actualPrice, payOnDelivery, phone: normalizePhone(body.phone) };
}
function putOrder(db, incoming) {
  const orderId = incoming.orderId.trim().slice(0, 80);
  const phone = normalizePhone(incoming.phone);
  const reference = incoming.paymentReference.trim();
  const existing = db.Orders.find((order) => order['Order ID'] === orderId || (normalizePhone(order['Phone Number']) === phone && order['Payment Reference'] === reference));
  if (existing) return { order: existing, duplicate: true };
  const customer = customerUpsert(db, incoming);
  const submittedAt = incoming.submittedAt && !Number.isNaN(Date.parse(incoming.submittedAt)) ? new Date(incoming.submittedAt).toISOString() : dateNow();
  const receiptNumber = String(incoming.receiptNumber || id('NRC')).slice(0, 80);
  const order = {
    'Order ID': orderId,
    'Customer ID': customer['Customer ID'],
    'Customer Name': incoming.customerName.trim(),
    'Phone Number': incoming.phone,
    'Product Name': incoming.productName.trim(),
    'Product Description': incoming.productDescription.trim(),
    'Service ID': incoming.serviceId,
    'Selected Service': incoming.service.name,
    'Service Fee': incoming.serviceFee,
    'Actual Product Price': incoming.actualPrice || '',
    'Outstanding Product Balance': incoming.actualPrice || 0,
    'Total Amount': incoming.serviceFee + incoming.actualPrice,
    'Payment Reference': incoming.paymentReference.trim(),
    'Payment Status': 'Pending',
    'Payment Method': String(incoming.paymentMethod || `TIPS ${TIPS_NUMBER}`).slice(0, 100),
    'TIPS Number': TIPS_NUMBER,
    'Pay on Delivery': incoming.payOnDelivery ? 'Yes' : 'No',
    'Order Status': 'New Order',
    'Submission Date': submittedAt,
    'Confirmation Date': '',
    'Completion Date': '',
    'Receipt Number': receiptNumber,
    'Delivery Address': String(incoming.deliveryAddress || '').slice(0, 500),
    Source: 'Website Bag Form',
  };
  db.Orders.push(order);
  db.Payments.push({ 'Payment ID': `${orderId}-PAY`, 'Order ID': orderId, 'Payment Reference': order['Payment Reference'], 'TIPS Number': TIPS_NUMBER, 'Service Fee': incoming.serviceFee, 'Payment Amount': incoming.serviceFee, 'Payment Method': order['Payment Method'], 'Verification Status': 'Pending', 'Payment Date': String(incoming.paymentDate || submittedAt).slice(0, 40), 'Verified Date': '', 'Verified By': '', Notes: 'Customer-entered reference; verification required.' });
  if (!db.Products.some((product) => product['Order ID'] === orderId)) db.Products.push({ 'Product ID': `${orderId}-PRD`, 'Order ID': orderId, 'Product Name': order['Product Name'], Description: order['Product Description'], 'Actual Price': incoming.actualPrice || '', 'Sourcing Information': '' });
  if (!db.Receipts.some((receipt) => receipt['Receipt Number'] === receiptNumber)) db.Receipts.push({ 'Receipt Number': receiptNumber, 'Order ID': orderId, 'Customer Name': order['Customer Name'], 'Phone Number': order['Phone Number'], 'Selected Service': order['Selected Service'], 'Service Fee': order['Service Fee'], 'Actual Product Price': order['Actual Product Price'], 'Outstanding Product Balance': order['Outstanding Product Balance'], 'Payment Method': order['Payment Method'], 'TIPS Number': TIPS_NUMBER, 'Transaction Reference': order['Payment Reference'], 'Payment Status': 'Pending', 'Receipt Date': submittedAt, 'Pay on Delivery': order['Pay on Delivery'] });
  audit(db, 'New Order', orderId, `Bag Form order received; payment ${order['Payment Status']}.`);
  return { order, duplicate: false };
}
function checkRateLimit(req, res, key, max, windowMs) {
  const now = Date.now();
  const record = limits.get(key);
  if (!record || record.reset < now) limits.set(key, { count: 1, reset: now + windowMs });
  else record.count += 1;
  const current = limits.get(key);
  if (current.count > max) { res.status(429).json({ error: 'Too many requests. Please try again later.' }); return false; }
  return true;
}
function getSession(req) {
  const token = req.cookies?.noah_desk_session;
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session;
}
function requireAuth(req, res, next) {
  if (!LOGIN_REQUIRED) return next();
  if (!getSession(req)) return res.status(401).json({ error: 'Administrator sign-in required.' });
  next();
}
function createReceipt(order, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 48, compress: false, info: { Title: `NOAH receipt ${order['Receipt Number']}`, Author: 'NOAH Digital Store' } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${order['Receipt Number']}.pdf"`);
  doc.pipe(res);
  doc.rect(0, 0, 595.28, 132).fill('#24314d');
  doc.roundedRect(48, 31, 40, 40, 8).lineWidth(1).strokeColor('#d5c9e0').stroke();
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('N', 61, 40);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('NOAH DIGITAL STORE', 102, 34);
  doc.font('Helvetica').fontSize(10).fillColor('#dce2ed').text('OFFICIAL PAYMENT RECEIPT', 102, 65);
  doc.fillColor('#d7ba55').rect(48, 108, 500, 3).fill();
  doc.fillColor('#24314d').font('Helvetica-Bold').fontSize(18).text(order['Receipt Number'], 48, 157);
  doc.font('Helvetica').fontSize(10).fillColor('#647084').text(`Order ${order['Order ID']}   •   ${new Date(order['Submission Date']).toLocaleString('en-TZ')}`, 48, 184);
  doc.moveTo(48, 216).lineTo(548, 216).strokeColor('#dce1e8').stroke();
  doc.fillColor('#24314d').font('Helvetica-Bold').fontSize(11).text('CUSTOMER', 48, 233);
  doc.font('Helvetica').fontSize(10).text(order['Customer Name'], 48, 254).text(order['Phone Number'], 48, 270).text(order['Delivery Address'] || 'Delivery details to be confirmed', 48, 286, { width: 470 });
  doc.moveTo(48, 320).lineTo(548, 320).strokeColor('#dce1e8').stroke();
  doc.fillColor('#6f4a8f').font('Helvetica-Bold').fontSize(10).text('SERVICE CATEGORY', 48, 338);
  doc.fillColor('#24314d').font('Helvetica-Bold').fontSize(13).text(order['Selected Service'], 48, 356, { width: 480 });
  doc.font('Helvetica').fontSize(10).fillColor('#647084').text(`Product: ${order['Product Name']}`, 48, 382, { width: 480 });
  doc.text(`Requirements: ${order['Product Description']}`, 48, 400, { width: 480, height: 45 });
  const y = 463;
  doc.fillColor('#24314d').font('Helvetica-Bold').fontSize(11).text('PAYMENT BREAKDOWN', 48, y);
  const rows = [
    ['Service fee', `TSh ${Number(order['Service Fee']).toLocaleString('en-TZ')} · ${order['Payment Status'] === 'Verified' ? 'PAID IN ADVANCE' : 'PENDING VERIFICATION'}`],
    ['Actual product price', order['Actual Product Price'] ? `TSh ${Number(order['Actual Product Price']).toLocaleString('en-TZ')}` : 'To be confirmed'],
    ['Outstanding product balance', order['Pay on Delivery'] === 'Yes' ? 'PAY ON DELIVERY' : `TSh ${Number(order['Outstanding Product Balance'] || 0).toLocaleString('en-TZ')}`],
    ['Total amount', `TSh ${Number(order['Total Amount']).toLocaleString('en-TZ')}`],
    ['Payment method', order['Payment Method']], ['TIPS number', TIPS_NUMBER], ['Transaction reference', order['Payment Reference']], ['Verification status', order['Payment Status']],
  ];
  let rowY = y + 28;
  rows.forEach(([label, value], index) => {
    if (index % 2 === 0) doc.rect(48, rowY - 5, 500, 25).fill('#f5f3f7');
    doc.fillColor('#647084').font('Helvetica').fontSize(9).text(label, 58, rowY + 2, { width: 175 });
    doc.fillColor('#24314d').font('Helvetica-Bold').text(value, 235, rowY + 2, { width: 300 });
    rowY += 25;
  });
  doc.moveTo(48, 770).lineTo(548, 770).strokeColor('#dce1e8').stroke();
  doc.fillColor('#647084').font('Helvetica').fontSize(8).text('NOAH Digital Store · Cheyo, Tabora, Tanzania · TIPS 251268047', 48, 784, { align: 'center', width: 500 });
  doc.end();
}
function customerWhatsappMessage(order) {
  const name = order['Customer Name'];
  return `Habari ${name},\n\nMalipo yako yamethibitishwa na oda yako imepokelewa na kuthibitishwa na NOAH Digital Store. \u2705\n\nNamba ya Oda: ${order['Order ID']}\nHuduma: ${order['Selected Service']}\nBidhaa: ${order['Product Name']}\nHali ya Malipo: Yamethibitishwa\nHali ya Oda: ${order['Order Status'] === 'Confirmed' ? 'Imethibitishwa' : order['Order Status']}\n\nTutakujulisha kila hatua ya oda yako. Asante kwa kuchagua NOAH Digital Store!\n\n---\nHello ${name}, your payment has been verified and your order ${order['Order ID']} has been received and confirmed. We will keep you updated.\n\nNOAH Digital Store – Your Trusted Digital Shopping Partner.`;
}
function customerWhatsapp(order) {
  return `https://wa.me/${normalizePhone(order['Phone Number']).replace(/\D/g, '')}?text=${encodeURIComponent(customerWhatsappMessage(order))}`;
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.NOAH_TRUST_PROXY === '1' ? 1 : false);
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use((req, res, next) => {
  const cookie = req.headers.cookie || '';
  req.cookies = Object.fromEntries(cookie.split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter((pair) => pair.length === 2));
  next();
});
const allowedOrigins = new Set(String(process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean));
app.options('/api/orders', (req, res) => {
  const origin = req.get('origin');
  const ownOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin && (origin === ownOrigin || allowedOrigins.has(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.sendStatus(204);
  }
  return res.sendStatus(origin ? 403 : 204);
});
app.post('/api/orders', async (req, res) => {
  const origin = req.get('origin');
  const ownOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin && origin !== ownOrigin && !allowedOrigins.has(origin)) return res.status(403).json({ error: 'This website origin is not allowed.' });
  if (origin && origin !== ownOrigin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  if (!checkRateLimit(req, res, `intake:${req.ip}`, 30, 60 * 60 * 1000)) return;
  try {
    const input = validateIncoming(req.body);
    const db = await readWorkbook();
    const result = putOrder(db, input);
    if (!result.duplicate) await saveDatabase(db);
    res.status(result.duplicate ? 200 : 201).json({ success: true, duplicate: result.duplicate, orderId: result.order['Order ID'], status: result.order['Order Status'] });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Order was not accepted.' });
  }
});
app.get('/api/health', async (req, res) => {
  try { const stats = await fs.promises.stat(DATABASE_PATH); res.json({ ok: true, database: path.basename(DATABASE_PATH), updatedAt: stats.mtime.toISOString() }); }
  catch { res.status(503).json({ ok: false, error: 'Database workbook unavailable.' }); }
});
app.post('/api/login', (req, res) => {
  if (!LOGIN_REQUIRED) return res.status(409).json({ error: 'Administrator login is disabled for this local desk.' });
  if (!checkRateLimit(req, res, `login:${req.ip}`, 8, 15 * 60 * 1000)) return;
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) return res.status(503).json({ error: 'Set NOAH_ADMIN_PASSWORD to a strong password of at least 12 characters, then restart the desk.' });
  const given = Buffer.from(String(req.body?.password || ''));
  const expected = Buffer.from(ADMIN_PASSWORD);
  const matches = given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!matches) return res.status(401).json({ error: 'Incorrect administrator password.' });
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, { expires: Date.now() + 8 * 60 * 60 * 1000, actor: 'Administrator' });
  res.cookie('noah_desk_session', token, { httpOnly: true, sameSite: 'strict', secure: req.secure, maxAge: 8 * 60 * 60 * 1000, path: '/' });
  res.json({ success: true });
});
app.get('/api/session', (req, res) => res.json({ authenticated: !LOGIN_REQUIRED || Boolean(getSession(req)), loginRequired: LOGIN_REQUIRED, passwordConfigured: LOGIN_REQUIRED }));
app.post('/api/logout', (req, res) => { const token = req.cookies?.noah_desk_session; if (token) sessions.delete(token); res.clearCookie('noah_desk_session', { sameSite: 'strict', path: '/' }); res.json({ success: true }); });
app.get('/api/data', requireAuth, async (req, res) => {
  try { const db = await readWorkbook(); res.json({ ...db, stats: summarize(db), database: path.basename(DATABASE_PATH) }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});
app.patch('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const db = await readWorkbook();
    const order = db.Orders.find((record) => record['Order ID'] === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const actor = getSession(req)?.actor || 'Administrator';
    const requestedStatus = req.body.orderStatus;
    const requestedPayment = req.body.paymentStatus;
    if (requestedStatus && !STATUSES.includes(requestedStatus)) return res.status(400).json({ error: 'Invalid order status.' });
    if (requestedPayment && !PAYMENT_STATUSES.includes(requestedPayment)) return res.status(400).json({ error: 'Invalid payment status.' });
    if (requestedStatus === 'Confirmed' && order['Payment Status'] !== 'Verified' && requestedPayment !== 'Verified') return res.status(409).json({ error: 'Verify the prepaid service fee before confirming this order.' });
    if (requestedPayment) {
      order['Payment Status'] = requestedPayment;
      const payment = db.Payments.find((record) => record['Order ID'] === order['Order ID']);
      if (payment) { payment['Verification Status'] = requestedPayment; payment['Verified Date'] = requestedPayment === 'Verified' ? dateNow() : ''; payment['Verified By'] = requestedPayment === 'Verified' ? actor : ''; }
      const receipt = db.Receipts.find((record) => record['Order ID'] === order['Order ID']);
      if (receipt) receipt['Payment Status'] = requestedPayment;
      if (requestedPayment === 'Verified' && (!requestedStatus || requestedStatus === order['Order Status'])) order['Order Status'] = 'Payment Verified';
      audit(db, `Payment ${requestedPayment}`, order['Order ID'], `Reference ${order['Payment Reference']}`, actor);
    }
    if (requestedStatus) {
      if (requestedStatus === 'Confirmed' && !order['Confirmation Date']) order['Confirmation Date'] = dateNow();
      if (requestedStatus === 'Completed') order['Completion Date'] = dateNow();
      order['Order Status'] = requestedStatus;
      audit(db, requestedStatus, order['Order ID'], 'Order status updated.', actor);
    }
    if (req.body.actualProductPrice !== undefined) {
      const amount = Number(req.body.actualProductPrice);
      if (!Number.isFinite(amount) || amount < 0 || amount > 1000000000) return res.status(400).json({ error: 'Enter a valid actual product price.' });
      order['Actual Product Price'] = amount || '';
      order['Total Amount'] = Number(order['Service Fee']) + amount;
      order['Outstanding Product Balance'] = amount;
      const product = db.Products.find((record) => record['Order ID'] === order['Order ID']);
      if (product) product['Actual Price'] = amount || '';
      const receipt = db.Receipts.find((record) => record['Order ID'] === order['Order ID']);
      if (receipt) { receipt['Actual Product Price'] = amount || ''; receipt['Outstanding Product Balance'] = amount; }
      audit(db, 'Product price updated', order['Order ID'], `Actual product price set to TSh ${amount.toLocaleString('en-TZ')}.`, actor);
    }
    await saveDatabase(db);
    res.json({ success: true, order, whatsappUrl: order['Confirmation Date'] && order['Order Status'] !== 'Cancelled' ? customerWhatsapp(order) : '' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});
app.get('/api/orders/:id/receipt.pdf', requireAuth, async (req, res) => {
  try { const db = await readWorkbook(); const order = db.Orders.find((record) => record['Order ID'] === req.params.id); if (!order) return res.status(404).json({ error: 'Order not found.' }); createReceipt(order, res); }
  catch (error) { res.status(500).json({ error: error.message }); }
});
app.get('/api/export', requireAuth, async (req, res) => {
  res.download(DATABASE_PATH, 'NOAH_DIGITAL_STORE_DATABASE.xlsx');
});
app.get('/api/backups', requireAuth, async (req, res) => {
  const files = (await fs.promises.readdir(BACKUP_DIR)).filter((file) => file.endsWith('.xlsx')).sort().reverse();
  res.json({ files });
});
app.get('/api/backups/:file', requireAuth, (req, res) => {
  const name = path.basename(req.params.file);
  if (!/^NOAH_DATABASE_[\w.-]+\.xlsx$/.test(name)) return res.sendStatus(400);
  res.download(path.join(BACKUP_DIR, name));
});
app.post('/api/import', requireAuth, upload.single('database'), async (req, res) => {
  try {
    if (!req.file || !req.file.originalname.toLowerCase().endsWith('.xlsx')) return res.status(400).json({ error: 'Choose a .xlsx database workbook.' });
    const importedWorkbook = new ExcelJS.Workbook();
    await importedWorkbook.xlsx.load(req.file.buffer);
    const imported = {};
    for (const [sheetName, columns] of Object.entries(HEADERS)) {
      const sheet = importedWorkbook.getWorksheet(sheetName);
      if (!sheet) throw new Error(`Import workbook is missing the '${sheetName}' worksheet.`);
      imported[sheetName] = recordsFromSheet(sheet, sheetName);
      const headers = sheet.getRow(1).values.slice(1).map((value) => String(value ?? '').trim());
      if (columns.some((column) => !headers.includes(column))) throw new Error(`Import workbook has invalid columns in '${sheetName}'.`);
    }
    const db = await readWorkbook();
    for (const sheet of ['Customers', 'Orders', 'Payments', 'Products', 'Receipts', 'Order Tracking', 'Settings', 'Reports']) db[sheet] = mergeSheet(db[sheet], imported[sheet], KEYS[sheet]);
    await saveDatabase(db);
    res.json({ success: true, importedOrders: imported.Orders.length });
  } catch (error) { res.status(400).json({ error: `Import rejected: ${error.message}` }); }
});
app.post('/api/backups/restore', requireAuth, upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a backup workbook.' });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    for (const [sheetName, columns] of Object.entries(HEADERS)) {
      const sheet = workbook.getWorksheet(sheetName);
      if (!sheet) throw new Error(`Missing worksheet '${sheetName}'.`);
      const headers = sheet.getRow(1).values.slice(1).map((value) => String(value ?? '').trim());
      if (columns.some((column) => !headers.includes(column))) throw new Error(`Invalid columns in '${sheetName}'.`);
      recordsFromSheet(sheet, sheetName);
    }
    await backupDatabase();
    const temporary = `${DATABASE_PATH}.${crypto.randomUUID()}.restore`;
    await fs.promises.writeFile(temporary, req.file.buffer);
    await fs.promises.rename(temporary, DATABASE_PATH);
    res.json({ success: true });
  } catch (error) { res.status(400).json({ error: `Restore rejected: ${error.message}` }); }
});
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/store', (req, res, next) => req.path === '/store' ? res.redirect(308, '/store/') : next());
app.get('/store/', async (req, res, next) => {
  try {
    const storefront = await fs.promises.readFile(path.join(ROOT, '..', 'index.html'), 'utf8');
    res.type('html').send(storefront.replace("window.NOAH_ORDER_API = '';", "window.NOAH_ORDER_API = '/api/orders';"));
  } catch (error) { next(error); }
});
const STORE_FILES = new Set(['styles.css', 'responsive.css', 'form-enhancements.css', 'store-upgrade.css', 'app.js', 'catalog.js']);
app.get('/store/:file', (req, res, next) => {
  if (!STORE_FILES.has(req.params.file)) return next();
  res.sendFile(path.join(ROOT, '..', req.params.file));
});
// Product, category and banner pictures (images folder only; nothing else from the storefront folder is exposed).
app.use('/store/images', express.static(path.join(ROOT, '..', 'images'), { index: false, dotfiles: 'deny', fallthrough: false }));
app.get(['/index.html', '/style.css', '/nav-fix.css', '/script.js', '/receipt-template.html', '/NOAH_DIGITAL_STORE_DATABASE.xlsx'], (req, res) => {
  const file = path.basename(req.path);
  res.sendFile(path.join(ROOT, file));
});
app.get('*path', (req, res) => {
  if (req.path.startsWith('/api/') || path.extname(req.path)) return res.sendStatus(404);
  res.sendFile(path.join(ROOT, 'index.html'));
});
app.use((error, req, res, next) => { console.error(error); if (res.headersSent) return next(error); res.status(500).json({ error: 'The local desk encountered an unexpected error.' }); });

function summarize(db) {
  const orders = db.Orders;
  return {
    totalOrders: orders.length,
    newOrders: orders.filter((order) => ['New Order', 'Pending Payment Verification'].includes(order['Order Status'])).length,
    confirmedOrders: orders.filter((order) => order['Order Status'] === 'Confirmed').length,
    completedOrders: orders.filter((order) => order['Order Status'] === 'Completed').length,
    cancelledOrders: orders.filter((order) => order['Order Status'] === 'Cancelled').length,
    feesCollected: orders.filter((order) => order['Payment Status'] === 'Verified').reduce((sum, order) => sum + Number(order['Service Fee'] || 0), 0),
    outstanding: orders.reduce((sum, order) => sum + Number(order['Outstanding Product Balance'] || 0), 0),
    customers: db.Customers.length,
  };
}

async function main() {
  await initializeDatabase();
  if (process.argv.includes('--create-template')) {
    await buildWorkbook(makeDefaultDatabase()).xlsx.writeFile(TEMPLATE_PATH);
    console.log(`Created ${TEMPLATE_PATH}`);
    return;
  }
  app.listen(PORT, HOST, () => {
    console.log(`NOAH Business Desk: http://${HOST}:${PORT}`);
    console.log(`Excel database: ${DATABASE_PATH}`);
    if (!LOGIN_REQUIRED) console.warn('Administrator login is disabled. Keep the desk bound to localhost and protect access to this Windows account.');
    if (allowedOrigins.size) console.log(`Allowed Bag Form origins: ${[...allowedOrigins].join(', ')}`);
  });
}
main().catch((error) => { console.error('Business Desk startup failed:', error); process.exitCode = 1; });
