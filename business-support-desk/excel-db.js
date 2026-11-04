(() => {
  'use strict';

  const WORKBOOK_NAME = 'NOAH Digital Stores Business Desk.xlsx';
  const CONFIG_KEY = 'noahDeskExcelConfig_v1';
  const PENDING_KEY = 'noahDeskExcelPending_v1';
  const GRAPH = 'https://graph.microsoft.com/v1.0';
  const SCOPES = ['User.Read', 'Files.ReadWrite'];
  const SCHEMAS = {
    Orders: ['id','orderReference','submittedAt','customer','phone','product','category','budget','fee','status','feeStatus','orderSubtotal','goodsSubtotal','totalAmount','amountPaid','outstandingBalance','paymentStatus','paymentMethod','receiptNumber','deliveryPreference','deliveryAddress','details','notes','source','originalReference','lineItemsJson','created','updated'],
    Customers: ['customerId','name','phone','orderCount','totalOrderValue','lastOrder'],
    Payments: ['id','orderId','amount','date','method','reference','notes'],
    Receipts: ['id','number','orderId','orderReference','date','total','paid','balance','paymentStatus'],
    Products: ['productId','name','category','unitPrice','quantityOrdered'],
    'Business Settings': ['key','value'],
    'Activity Logs': ['id','time','action','order','details']
  };

  let config = readConfig();
  let authClient = null;
  let account = null;
  let accessToken = '';
  let fileId = '';
  let sessionId = '';
  let sheets = {};
  let connected = false;
  let pendingData = null;
  let syncTimer = 0;
  let syncChain = Promise.resolve();

  function readConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch { return {}; }
  }

  function setStatus(message) {
    const status = document.getElementById('excel-state');
    if (status) status.textContent = message;
  }

  function showError(error) {
    setStatus('Excel connection error');
    alert(error.message || String(error));
  }

  function apiUrl(path) {
    return `${GRAPH}${path}`;
  }

  async function getAccessToken() {
    if (!authClient || !account) throw new Error('Sign in to Microsoft before using the Excel database.');
    try {
      const result = await authClient.acquireTokenSilent({ scopes: SCOPES, account });
      accessToken = result.accessToken;
    } catch (error) {
      if (error instanceof msal.InteractionRequiredAuthError) {
        const result = await authClient.acquireTokenPopup({ scopes: SCOPES, account });
        accessToken = result.accessToken;
      } else {
        throw error;
      }
    }
    return accessToken;
  }

  async function graph(path, options = {}) {
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    if (options.body && !(options.body instanceof ArrayBuffer) && !(options.body instanceof Blob)) headers['Content-Type'] = 'application/json';
    if (sessionId && path.includes('/workbook/')) headers['workbook-session-id'] = sessionId;
    const response = await fetch(apiUrl(path), { ...options, headers });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Microsoft Graph returned ${response.status}: ${detail.slice(0, 400)}`);
    }
    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('json') ? response.json() : null;
  }

  function columnName(number) {
    let name = '';
    while (number > 0) {
      const remainder = (number - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      number = Math.floor((number - 1) / 26);
    }
    return name;
  }

  function rangePath(sheetId, address, suffix = '') {
    return `/me/drive/items/${encodeURIComponent(fileId)}/workbook/worksheets/${encodeURIComponent(sheetId)}/range(address='${address}')${suffix}`;
  }

  function safeCell(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string' && /^[\s]*[=+@]/.test(value)) return "'" + value;
    return value;
  }

  function recordRows(name, records) {
    const columns = SCHEMAS[name];
    return [columns, ...records.map(record => columns.map(column => safeCell(record[column])))];
  }

  function customerRecords(database) {
    const customers = new Map();
    database.requests.forEach(order => {
      const phone = String(order.phone || '').replace(/\D/g, '');
      const key = phone || String(order.customer || '').toLowerCase();
      const current = customers.get(key) || { customerId: key, name: order.customer || '', phone: order.phone || '', orderCount: 0, totalOrderValue: 0, lastOrder: '' };
      current.orderCount += 1;
      current.totalOrderValue += Number(order.totalAmount || order.estimatedTotal || order.orderSubtotal || 0);
      current.lastOrder = String(order.submittedAt || order.created || '') > current.lastOrder ? String(order.submittedAt || order.created || '') : current.lastOrder;
      customers.set(key, current);
    });
    return [...customers.values()];
  }

  function productRecords(database) {
    const products = new Map();
    database.requests.forEach(order => (order.lineItems || []).forEach(item => {
      const id = item.productId || item.name;
      const current = products.get(id) || { productId: id, name: item.name || id, category: order.category || '', unitPrice: Number(item.unitPrice || 0), quantityOrdered: 0 };
      current.quantityOrdered += Number(item.quantity || 0);
      products.set(id, current);
    }));
    return [...products.values()];
  }

  function exportRows(database) {
    return {
      Orders: database.requests.map(order => ({ ...order, id: order.id || order.orderId || '', orderReference: order.orderReference || order.no || '', customer: order.customer || order.customerName || '', product: order.product || order.productSummary || '', lineItemsJson: JSON.stringify(order.lineItems || []) })),
      Customers: customerRecords(database),
      Payments: database.payments,
      Receipts: database.receipts,
      Products: productRecords(database),
      'Business Settings': Object.entries(database.settings || {}).map(([key, value]) => ({ key, value: String(value) })),
      'Activity Logs': database.activity
    };
  }

  function mergeRecords(remote, pending, key) {
    const records = new Map((remote || []).map(record => [String(record[key]), record]));
    (pending || []).forEach(record => records.set(String(record[key]), record));
    return [...records.values()];
  }

  function mergeDatabases(remote, pending) {
    return {
      ...remote,
      settings: { ...remote.settings, ...pending.settings },
      requests: mergeRecords(remote.requests, pending.requests, 'id'),
      payments: mergeRecords(remote.payments, pending.payments, 'id'),
      receipts: mergeRecords(remote.receipts, pending.receipts, 'id'),
      activity: mergeRecords(remote.activity, pending.activity, 'id'),
      suppliers: pending.suppliers || remote.suppliers || [],
      transactions: pending.transactions || remote.transactions || []
    };
  }

  function mergeBrowserOrders(remote, local) {
    const cloudIds = new Set(remote.requests.map(order => String(order.id || order.orderId)));
    const browserOnly = local.requests.filter(order => !cloudIds.has(String(order.id || order.orderId)));
    return { ...remote, requests: [...remote.requests, ...browserOnly] };
  }

  async function createWorkbook() {
    if (!window.XLSX) throw new Error('The Excel workbook library did not load. Check your internet connection and reload the page.');
    const workbook = XLSX.utils.book_new();
    Object.entries(SCHEMAS).forEach(([name, columns]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([columns]), name));
    const content = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const path = `/me/drive/root:/${encodeURIComponent(WORKBOOK_NAME)}:/content`;
    const result = await graph(path, { method: 'PUT', body: content, headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } });
    return result;
  }

  async function findOrCreateWorkbook() {
    const query = encodeURIComponent(WORKBOOK_NAME);
    const result = await graph(`/me/drive/root/search(q='${query}')?$select=id,name,file&$top=100`);
    const existing = (result.value || []).find(item => item.name === WORKBOOK_NAME && item.file);
    return existing || createWorkbook();
  }

  async function connectWorkbook() {
    setStatus('Finding Excel workbook…');
    const item = await findOrCreateWorkbook();
    if (!item || !item.id) throw new Error('Could not create or locate the OneDrive workbook.');
    fileId = item.id;
    const session = await graph(`/me/drive/items/${encodeURIComponent(fileId)}/workbook/createSession`, { method: 'POST', body: JSON.stringify({ persistChanges: true }) });
    sessionId = session.id;
    const workbookSheets = await graph(`/me/drive/items/${encodeURIComponent(fileId)}/workbook/worksheets`);
    sheets = Object.fromEntries((workbookSheets.value || []).map(sheet => [sheet.name, sheet.id]));
    const missing = Object.keys(SCHEMAS).filter(name => !sheets[name]);
    if (missing.length) throw new Error(`Workbook is missing sheet(s): ${missing.join(', ')}. Delete or rename the incomplete workbook, then reconnect to create a fresh one.`);
    const cloud = await importWorkbook();
    connected = true;
    const local = window.noahDeskData ? window.noahDeskData() : null;
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); } catch {}
    if (pending) {
      const merged = mergeDatabases(cloud, pending);
      setStatus('Saving existing browser orders to Excel…');
      await writeWorkbook(merged);
      localStorage.removeItem(PENDING_KEY);
      window.dispatchEvent(new CustomEvent('noah-excel-data', { detail: merged }));
    } else if (local?.requests?.length) {
      const merged = mergeBrowserOrders(cloud, local);
      if (merged.requests.length > cloud.requests.length) {
        setStatus('Saving browser-only orders to Excel…');
        await writeWorkbook(merged);
      }
      window.dispatchEvent(new CustomEvent('noah-excel-data', { detail: merged }));
    } else {
      window.dispatchEvent(new CustomEvent('noah-excel-data', { detail: cloud }));
    }
    setStatus(`Excel connected · ${WORKBOOK_NAME}`);
  }

  async function readSheet(name) {
    const sheetId = sheets[name];
    const result = await graph(`/me/drive/items/${encodeURIComponent(fileId)}/workbook/worksheets/${encodeURIComponent(sheetId)}/usedRange(valuesOnly=true)`);
    const values = result?.values || [];
    if (values.length < 2) return [];
    const headers = values[0].map(value => String(value || ''));
    return values.slice(1).filter(row => row.some(value => value !== '' && value !== null)).map(row => headers.reduce((record, key, index) => { record[key] = row[index] ?? ''; return record; }, {}));
  }

  async function importWorkbook() {
    const [orders, payments, receipts, settings, activity] = await Promise.all([
      readSheet('Orders'), readSheet('Payments'), readSheet('Receipts'), readSheet('Business Settings'), readSheet('Activity Logs')
    ]);
    const requests = orders.map(order => {
      let lineItems = [];
      try { lineItems = JSON.parse(order.lineItemsJson || '[]'); } catch {}
      return { ...order, orderId: order.id, no: order.orderReference, lineItems, budget: Number(order.budget || 0), fee: Number(order.fee || 0), orderSubtotal: Number(order.orderSubtotal || 0), goodsSubtotal: Number(order.goodsSubtotal || 0), totalAmount: Number(order.totalAmount || 0), amountPaid: Number(order.amountPaid || 0), outstandingBalance: Number(order.outstandingBalance || 0) };
    });
    const parsedSettings = Object.fromEntries(settings.map(row => [row.key, row.value]));
    return {
      settings: { name: parsedSettings.name || 'NOAH DIGITAL STORES', phone: parsedSettings.phone || '255614128298', location: parsedSettings.location || 'Cheyo, Tabora, Tanzania', footer: parsedSettings.footer || 'Thank you for choosing NOAH DIGITAL STORES.' },
      requests, suppliers: [], transactions: [], payments: payments.map(row => ({ ...row, amount: Number(row.amount || 0) })),
      receipts: receipts.map(row => ({ ...row, total: Number(row.total || 0), paid: Number(row.paid || 0), balance: Number(row.balance || 0) })), activity
    };
  }

  async function writeSheet(name, records) {
    const matrix = recordRows(name, records);
    const lastColumn = columnName(SCHEMAS[name].length);
    const current = await graph(`/me/drive/items/${encodeURIComponent(fileId)}/workbook/worksheets/${encodeURIComponent(sheets[name])}/usedRange(valuesOnly=true)`);
    const oldRows = Number(current?.rowCount || 1);
    if (oldRows > matrix.length) {
      const clearAddress = `A${matrix.length + 1}:${columnName(Number(current.columnCount || SCHEMAS[name].length))}${oldRows}`;
      await graph(rangePath(sheets[name], clearAddress, '/clear'), { method: 'POST', body: JSON.stringify({ applyTo: 'Contents' }) });
    }
    const address = `A1:${lastColumn}${matrix.length}`;
    await graph(rangePath(sheets[name], address), { method: 'PATCH', body: JSON.stringify({ values: matrix }) });
  }

  async function writeWorkbook(database) {
    if (!connected && !fileId) return;
    const records = exportRows(database);
    for (const [name, rows] of Object.entries(records)) await writeSheet(name, rows);
  }

  function queueWrite(database) {
    pendingData = JSON.parse(JSON.stringify(database));
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(pendingData)); } catch {}
    if (!connected) {
      setStatus('Changes saved here · Excel sync pending');
      return;
    }
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const snapshot = pendingData;
      syncChain = syncChain.then(() => writeWorkbook(snapshot)).then(() => {
        localStorage.removeItem(PENDING_KEY);
        setStatus(`Saved to Excel · ${WORKBOOK_NAME}`);
      }).catch(error => {
        connected = false;
        setStatus('Excel sync failed');
        console.error(error);
        alert(`The browser copy was saved, but Excel could not be updated. Reconnect and retry. ${error.message}`);
      });
    }, 700);
  }

  async function connect(values) {
    if (!window.msal) throw new Error('Microsoft sign-in library did not load. Check your internet connection and reload.');
    if (values?.clientId) config = { clientId: String(values.clientId).trim(), tenantId: String(values.tenantId || 'organizations').trim() };
    if (!config.clientId || !config.tenantId) {
      document.querySelector('[data-page="settings"]')?.click();
      alert('Enter the Microsoft Entra client ID and tenant ID under Settings first.');
      return;
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    try {
      authClient = new msal.PublicClientApplication({
        auth: { clientId: config.clientId, authority: `https://login.microsoftonline.com/${config.tenantId}`, redirectUri: location.href.split(/[?#]/)[0] },
        cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false }
      });
      await authClient.initialize();
      const result = await authClient.loginPopup({ scopes: SCOPES });
      account = result.account;
      accessToken = result.accessToken;
      await connectWorkbook();
    } catch (error) {
      connected = false;
      setStatus('Excel not connected');
      showError(error);
    }
  }

  async function refresh() {
    if (!connected) return connect();
    try {
      const latest = await importWorkbook();
      window.dispatchEvent(new CustomEvent('noah-excel-data', { detail: latest }));
      setStatus(`Excel connected · ${WORKBOOK_NAME}`);
    } catch (error) { showError(error); }
  }

  window.noahExcelConfig = () => config;
  window.noahExcelConnect = connect;
  window.noahExcelSave = queueWrite;
  window.noahExcelRefresh = refresh;
  window.noahExcelIsConnected = () => connected;
  window.addEventListener('load', () => {
    if (config.clientId && document.getElementById('excel-state')) resumeConnection();
  });

  async function resumeConnection() {
    try {
      authClient = new msal.PublicClientApplication({
        auth: { clientId: config.clientId, authority: `https://login.microsoftonline.com/${config.tenantId || 'organizations'}`, redirectUri: location.href.split(/[?#]/)[0] },
        cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false }
      });
      await authClient.initialize();
      account = authClient.getAllAccounts()[0] || null;
      if (!account) {
        setStatus('Excel ready · connect to sign in');
        return;
      }
      await connectWorkbook();
    } catch (error) {
      connected = false;
      setStatus('Excel ready · reconnect to sync');
      console.warn('Automatic Excel reconnect was unavailable:', error.message || error);
    }
  }
})();
