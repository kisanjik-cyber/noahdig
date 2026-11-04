const STORE = Object.freeze({
  name: "Noah Digital Store",
  whatsappNumber: "255745468020",
  phoneDisplay: "+255 745 468 020",
  phoneLink: "+255745468020",
  currency: "TZS"
});

const SERVICE_OPTIONS = Object.freeze({
  ask: { label: "Ask about a product", fee: 1000 },
  find: { label: "Ask us to find a product", fee: 2000 },
  buy: { label: "Buy goods and arrange delivery", fee: 5000 }
});

const products = [
  { id: "NDS-001", name: "USB-C Fast Wall Charger", category: "Power & charging", brand: "Everyday Tech", price: 25000, previousPrice: 30000, stock: 8, rating: 4.8, reviews: 24, badge: "17% OFF", featured: true, image: "photo-1583394838336-acd977736f90", keywords: "charger adapter type c fast samsung phone power", description: "A compact everyday charger for compatible USB-C devices.", specs: ["USB-C output", "Compact design", "Wall adapter"] },
  { id: "NDS-002", name: "Braided USB-C Cable", category: "Power & charging", brand: "Everyday Tech", price: 10000, previousPrice: 13000, stock: 14, rating: 4.7, reviews: 18, badge: "POPULAR", featured: true, image: "photo-1583863788434-e58a36330cf0", keywords: "cable charging type c usb braided", description: "A durable-feel braided cable for charging and everyday use.", specs: ["USB-C connector", "Braided finish", "Everyday length"] },
  { id: "NDS-003", name: "Over-Ear Wireless Headphones", category: "Audio", brand: "Sound Daily", price: 68000, previousPrice: 82000, stock: 5, rating: 4.9, reviews: 31, badge: "17% OFF", featured: true, image: "photo-1505740420928-5e560c06d30e", keywords: "headphones bluetooth wireless music audio", description: "Comfortable over-ear listening for music, calls and focus time.", specs: ["Wireless connection", "Over-ear fit", "Foldable design"] },
  { id: "NDS-004", name: "Wireless Bluetooth Earbuds", category: "Audio", brand: "Sound Daily", price: 48000, previousPrice: null, stock: 11, rating: 4.6, reviews: 16, badge: "NEW IN", featured: true, isNew: true, image: "photo-1590658268037-6bf12165a8df", keywords: "earbuds earphones bluetooth wireless audio", description: "Pocket-sized wireless earbuds for commutes and calls.", specs: ["Bluetooth audio", "Pocket charging case", "Touch controls"] },
  { id: "NDS-005", name: "Portable Bluetooth Speaker", category: "Audio", brand: "Sound Daily", price: 55000, previousPrice: 65000, stock: 6, rating: 4.8, reviews: 27, badge: "15% OFF", featured: true, image: "photo-1608043152269-423dbba4e7e1", keywords: "speaker bluetooth portable sound music", description: "Bring your playlist along with a compact portable speaker.", specs: ["Wireless playback", "Portable size", "Rechargeable"] },
  { id: "NDS-006", name: "Wireless Precision Mouse", category: "Computer", brand: "Desk Works", price: 28000, previousPrice: null, stock: 9, rating: 4.7, reviews: 14, badge: "STAFF PICK", featured: true, image: "photo-1527814050087-3793815479db", keywords: "mouse wireless computer laptop office", description: "A comfortable wireless mouse for study, work and home.", specs: ["Wireless connection", "Ergonomic shape", "USB receiver"] },
  { id: "NDS-007", name: "Compact Keyboard & Mouse Set", category: "Computer", brand: "Desk Works", price: 58000, previousPrice: null, stock: 4, rating: 4.5, reviews: 11, badge: "LOW STOCK", featured: false, image: "photo-1587829741301-dc798b83add3", keywords: "keyboard mouse computer desktop office", description: "A practical keyboard and mouse pairing for your desk.", specs: ["Full-size keyboard", "Matching mouse", "USB connection"] },
  { id: "NDS-008", name: "Dual USB Flash Drive · 64 GB", category: "Storage", brand: "Store More", price: 22000, previousPrice: 26000, stock: 18, rating: 4.8, reviews: 22, badge: "15% OFF", featured: true, image: "photo-1618410320928-25228d811631", keywords: "flash drive usb storage memory stick", description: "Handy removable storage for everyday files and transfers.", specs: ["64 GB capacity", "USB storage", "Portable format"] },
  { id: "NDS-009", name: "MicroSD Memory Card · 128 GB", category: "Storage", brand: "Store More", price: 29000, previousPrice: null, stock: 7, rating: 4.6, reviews: 9, badge: "GOOD FIND", featured: false, image: "photo-1591488320449-011701bb6704", keywords: "memory card micro sd microsd storage phone", description: "Extra storage for compatible phones, cameras and devices.", specs: ["128 GB capacity", "MicroSD format", "For compatible devices"] },
  { id: "NDS-010", name: "Portable External SSD · 500 GB", category: "Storage", brand: "Store More", price: 185000, previousPrice: 215000, stock: 3, rating: 4.9, reviews: 13, badge: "14% OFF", featured: true, image: "photo-1597872200969-2b65d56bd16b", keywords: "ssd external drive storage hard disk hdd laptop", description: "Portable solid-state storage for files, projects and backups.", specs: ["500 GB capacity", "Portable SSD", "USB connection"] },
  { id: "NDS-011", name: "Braided Ethernet Cable · 5 m", category: "Networking", brand: "Connect Well", price: 12000, previousPrice: null, stock: 12, rating: 4.6, reviews: 8, badge: "IN STOCK", featured: false, image: "photo-1558618666-fcd25c85cd64", keywords: "ethernet lan internet networking cable router rj45", description: "A practical wired connection for routers and network devices.", specs: ["5 metre length", "Ethernet cable", "RJ45 connectors"] },
  { id: "NDS-012", name: "4-Port USB 3.0 Hub", category: "Computer", brand: "Desk Works", price: 35000, previousPrice: 42000, stock: 0, rating: 4.7, reviews: 19, badge: "SOLD OUT", featured: false, image: "photo-1625842268584-8f3296236761", keywords: "usb hub ports adapter laptop computer accessories", description: "Add extra USB connections to a compatible computer setup.", specs: ["4 USB ports", "USB 3.0", "Plug and play"] },
  { id: "NDS-013", name: "Everyday Phone Cover", category: "Mobile accessories", brand: "Everyday Tech", price: 18000, previousPrice: null, stock: 10, rating: 4.5, reviews: 7, badge: "GOOD FIND", featured: false, image: "photo-1511707171634-5f897ff02aa9", keywords: "phone case cover mobile smartphone protection", description: "A simple everyday cover option. Confirm your phone model before ordering.", specs: ["Phone cover", "Choose by device model", "Confirm fit with our team"] },
  { id: "NDS-014", name: "Tempered Glass Screen Protector", category: "Mobile accessories", brand: "Everyday Tech", price: 12000, previousPrice: null, stock: 9, rating: 4.4, reviews: 6, badge: "GOOD FIND", featured: false, image: "photo-1511707171634-5f897ff02aa9", keywords: "screen protector tempered glass mobile phone", description: "Screen protection for compatible phones. Ask us to check your model.", specs: ["Tempered glass", "Choose by device model", "Confirm fit with our team"] },
  { id: "NDS-015", name: "Slim Phone Cover", category: "Mobile accessories", brand: "Everyday Tech", price: 15000, stock: 12, rating: 4.5, reviews: 5, badge: "NEW IN", image: "photo-1598327105666-5b89351aff97", keywords: "phone case cover mobile smartphone slim", description: "A slim everyday cover. Confirm the exact device model before ordering.", specs: ["Slim phone cover", "Choose by device model", "Confirm fit with our team"] },
  { id: "NDS-016", name: "USB-C to Lightning Cable", category: "Mobile accessories", brand: "Everyday Tech", price: 18000, stock: 8, rating: 4.6, reviews: 8, badge: "GOOD FIND", image: "photo-1605236453806-6ff36851218e", keywords: "lightning cable iphone charging phone", description: "A charging cable option for compatible Lightning devices.", specs: ["USB-C to Lightning", "Charging cable", "Check device compatibility"] },
  { id: "NDS-017", name: "Foldable Phone Stand", category: "Mobile accessories", brand: "Everyday Tech", price: 14000, stock: 15, rating: 4.4, reviews: 4, badge: "EVERYDAY PICK", image: "photo-1512499617640-c74ae3a79d37", keywords: "phone stand holder desk mobile", description: "A compact stand for hands-free viewing on a desk or table.", specs: ["Foldable stand", "Desk accessory", "For compatible phone sizes"] },
  { id: "NDS-018", name: "Wired In-Ear Earphones", category: "Audio", brand: "Sound Daily", price: 18000, stock: 13, rating: 4.5, reviews: 10, badge: "EVERYDAY PICK", image: "photo-1484704849700-f032a568e944", keywords: "earphones wired in ear headphones audio", description: "Simple in-ear listening for compatible phones and audio devices.", specs: ["Wired earphones", "In-ear fit", "Check connector type"] },
  { id: "NDS-019", name: "Studio-Style Headphones", category: "Audio", brand: "Sound Daily", price: 72000, stock: 5, rating: 4.7, reviews: 12, badge: "NEW IN", image: "photo-1546435770-a3e426bf472b", keywords: "headphones studio wired over ear audio music", description: "Over-ear headphones for focused listening at home or on the go.", specs: ["Over-ear design", "Audio cable", "Check connector compatibility"] },
  { id: "NDS-020", name: "Compact Bluetooth Earbuds", category: "Audio", brand: "Sound Daily", price: 42000, stock: 7, rating: 4.6, reviews: 9, badge: "GOOD FIND", image: "photo-1590658268037-6bf12165a8df", keywords: "bluetooth earbuds wireless audio earphones", description: "Compact wireless earbuds for everyday listening and calls.", specs: ["Bluetooth connection", "Charging case", "Touch controls"] },
  { id: "NDS-021", name: "Full-Size USB Keyboard", category: "Computer", brand: "Desk Works", price: 32000, stock: 8, rating: 4.5, reviews: 7, badge: "EVERYDAY PICK", image: "photo-1587829741301-dc798b83add3", keywords: "keyboard usb computer laptop desk", description: "A full-size keyboard for a practical home or work setup.", specs: ["Full-size layout", "USB connection", "Computer accessory"] },
  { id: "NDS-022", name: "Ergonomic Wireless Mouse", category: "Computer", brand: "Desk Works", price: 30000, stock: 6, rating: 4.6, reviews: 8, badge: "NEW IN", image: "photo-1527864550417-7fd91fc51a46", keywords: "mouse wireless computer ergonomic laptop", description: "A wireless mouse option for compatible laptops and computers.", specs: ["Wireless connection", "Ergonomic shape", "USB receiver"] },
  { id: "NDS-023", name: "Laptop Cooling Stand", category: "Computer", brand: "Desk Works", price: 45000, stock: 5, rating: 4.4, reviews: 5, badge: "GOOD FIND", image: "photo-1525547719571-a2d4ac8945e2", keywords: "laptop stand cooling computer desk accessory", description: "A raised laptop stand to help organize a desk setup.", specs: ["Laptop stand", "Desk accessory", "Check laptop size"] },
  { id: "NDS-024", name: "USB Flash Drive · 32 GB", category: "Storage", brand: "Store More", price: 14000, stock: 17, rating: 4.6, reviews: 11, badge: "EVERYDAY PICK", image: "photo-1624823183493-ed5832f48f18", keywords: "usb flash drive storage memory stick 32gb", description: "A pocket-sized USB drive for everyday document storage.", specs: ["32 GB capacity", "USB storage", "Portable format"] },
  { id: "NDS-025", name: "MicroSD Memory Card · 64 GB", category: "Storage", brand: "Store More", price: 19000, stock: 10, rating: 4.5, reviews: 8, badge: "GOOD FIND", image: "photo-1612198188060-c7c2a3b66eae", keywords: "micro sd microsd memory card storage 64gb", description: "Additional storage for compatible phones, cameras and devices.", specs: ["64 GB capacity", "MicroSD format", "Check device compatibility"] },
  { id: "NDS-026", name: "Portable HDD · 1 TB", category: "Storage", brand: "Store More", price: 145000, stock: 4, rating: 4.7, reviews: 10, badge: "LOW STOCK", image: "photo-1531492746076-161ca9bcad58", keywords: "hard drive hdd external storage portable 1tb", description: "Portable hard-drive storage for files and backups.", specs: ["1 TB capacity", "Portable hard drive", "USB connection"] },
  { id: "NDS-027", name: "Gigabit Wi-Fi Router", category: "Networking", brand: "Connect Well", price: 95000, stock: 5, rating: 4.6, reviews: 9, badge: "NEW IN", image: "photo-1544197150-b99a580bb7a8", keywords: "router wifi wireless internet networking", description: "A home networking option. Confirm coverage and device requirements before ordering.", specs: ["Wi-Fi router", "Multiple network ports", "Confirm setup needs"] },
  { id: "NDS-028", name: "RJ45 Ethernet Connector Pack", category: "Networking", brand: "Connect Well", price: 8000, stock: 20, rating: 4.4, reviews: 6, badge: "EVERYDAY PICK", image: "photo-1558494949-ef010cbdcc31", keywords: "rj45 connector ethernet network lan plug", description: "RJ45 connectors for compatible Ethernet cable setups.", specs: ["RJ45 connectors", "Network accessory", "Cable tools sold separately"] },
  { id: "NDS-029", name: "USB Wi-Fi Adapter", category: "Networking", brand: "Connect Well", price: 26000, stock: 7, rating: 4.5, reviews: 7, badge: "GOOD FIND", image: "photo-1606904825846-647eb07f5be2", keywords: "usb wifi adapter wireless network computer", description: "A USB Wi-Fi adapter option for compatible computers.", specs: ["USB adapter", "Wireless networking", "Check OS compatibility"] },
  { id: "NDS-030", name: "Dual-Port USB Wall Charger", category: "Power & charging", brand: "Everyday Tech", price: 28000, stock: 9, rating: 4.6, reviews: 12, badge: "GOOD FIND", image: "photo-1583863788434-e58a36330cf0", keywords: "wall charger dual port usb power adapter", description: "A two-port wall charger for compatible everyday devices.", specs: ["Dual USB ports", "Wall adapter", "Check device requirements"] },
  { id: "NDS-031", name: "USB-C Charging Cable · 2 m", category: "Power & charging", brand: "Everyday Tech", price: 14000, stock: 12, rating: 4.5, reviews: 9, badge: "EVERYDAY PICK", image: "photo-1556656793-08538906a9f8", keywords: "usb c cable charging type c long 2m", description: "An extra-length USB-C cable for compatible charging setups.", specs: ["2 metre cable", "USB-C connector", "Check charging compatibility"] },
  { id: "NDS-032", name: "Universal Travel Adapter", category: "Power & charging", brand: "Everyday Tech", price: 35000, stock: 6, rating: 4.5, reviews: 8, badge: "NEW IN", image: "photo-1625842268584-8f3296236761", keywords: "travel power adapter plug charger universal", description: "A travel adapter option. Confirm plug type and device compatibility.", specs: ["Travel adapter", "Power accessory", "Confirm plug compatibility"] },
  { id: "NDS-034", name: "Miicam 1080p USB Webcam", category: "Computer", brand: "Miicam", price: 45000, stock: 0, rating: null, reviews: null, badge: "PENDING", featured: false, image: "assets/miicam-webcam-illustration.svg", keywords: "webcam usb full hd 1080p video calls conferencing windows mac miicam", description: "Retail listings describe a 1080p USB 2.0 webcam with a built-in microphone and Windows/Mac compatibility. Confirm exact product configuration, Noah price, image, and stock before ordering.", specs: ["1080p video per retailer listing", "USB 2.0 connection per retailer listing", "Built-in microphone per retailer listing", "Windows and Mac compatibility per retailer listing"], pendingApproval: true, priceNote: "Retail reference only: TZS 45,000. Noah selling price not approved." }
];

const categories = [
  { name: "Mobile accessories", key: "Mobile", description: "Covers, cables & screen care", image: "photo-1511707171634-5f897ff02aa9", icon: "◈", count: "Everyday essentials" },
  { name: "Audio", key: "Audio", description: "Earbuds, headphones & sound", image: "photo-1505740420928-5e560c06d30e", icon: "♫", count: "Find your sound" },
  { name: "Computer accessories", key: "Computer", description: "Desk gear, hubs & more", image: "photo-1527814050087-3793815479db", icon: "⌘", count: "Work a little smarter" },
  { name: "Storage", key: "Storage", description: "Memory for all your things", image: "photo-1591488320449-011701bb6704", icon: "▣", count: "Keep it close" },
  { name: "Networking", key: "Networking", description: "Connections made simple", image: "photo-1558618666-fcd25c85cd64", icon: "⌁", count: "Stay connected" },
  { name: "Power & charging", key: "Power", description: "Chargers, cables & power", image: "photo-1583863788434-e58a36330cf0", icon: "ϟ", count: "Power your day" }
];

const state = {
  category: "All",
  search: "",
  sort: "featured",
  limit: 8,
  wishlistOnly: false,
  dealOnly: false,
  newOnly: false,
  cart: readStorage("noah-cart", []),
  wishlist: readStorage("noah-wishlist", [])
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const formatPrice = amount => `${STORE.currency} ${new Intl.NumberFormat("en-TZ").format(amount)}`;
const imageUrl = (id, width = 640) => id.startsWith("assets/") ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { showToast("Your browser could not save this on this device."); }
}

function configureContactLinks() {
  $$('a[href^="https://wa.me/"]').forEach(link => {
    const original = new URL(link.href);
    link.href = `https://wa.me/${STORE.whatsappNumber}${original.search}`;
  });
  $$('a[href^="tel:"]').forEach(link => {
    link.href = `tel:${STORE.phoneLink}`;
    if (link.textContent.includes("+255")) link.textContent = link.textContent.replace(/\+255[\s\d]+/, STORE.phoneDisplay);
  });
  const orgSchema = $("script[type='application/ld+json']");
  if (orgSchema) {
    const schema = JSON.parse(orgSchema.textContent);
    schema.telephone = STORE.phoneDisplay;
    orgSchema.textContent = JSON.stringify(schema);
  }
}

function renderCategories() {
  const counts = Object.fromEntries(categories.map(category => [category.key, products.filter(product => product.category.toLowerCase().includes(category.key.toLowerCase())).length]));
  $("#category-grid").innerHTML = categories.map(category => `
    <a class="category-card" href="#shop" data-category="${category.key}">
      <div class="category-photo"><img src="${imageUrl(category.image, 420)}" alt="${category.name}" loading="lazy"><span class="category-icon" aria-hidden="true">${category.icon}</span></div>
      <h3>${category.name}</h3><p>${category.description}</p>
      <div class="category-meta"><span>${counts[category.key] || 0} picks · ${category.count}</span><span aria-hidden="true">↗</span></div>
    </a>`).join("");
}

function renderPills() {
  const options = ["All", ...categories.map(category => category.key)];
  $("#category-pills").innerHTML = options.map(category => `<button class="category-pill${state.category === category ? " selected" : ""}" type="button" data-filter-category="${category}">${category === "All" ? "Everything" : category}</button>`).join("");
}

function filteredProducts() {
  const query = state.search.trim().toLowerCase();
  let result = products.filter(product => {
    const haystack = `${product.name} ${product.category} ${product.brand} ${product.id} ${product.keywords}`.toLowerCase();
    return (!query || haystack.includes(query)) &&
      (state.category === "All" || product.category.toLowerCase().includes(state.category.toLowerCase())) &&
      (!state.wishlistOnly || state.wishlist.includes(product.id)) &&
      (!state.dealOnly || product.previousPrice) &&
      (!state.newOnly || product.isNew);
  });
  if (state.sort === "price-low") result.sort((a, b) => a.price - b.price);
  if (state.sort === "price-high") result.sort((a, b) => b.price - a.price);
  if (state.sort === "rating") result.sort((a, b) => b.rating - a.rating);
  if (state.sort === "newest") result.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
  if (state.sort === "featured") result.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  return result;
}

function priceMarkup(product) {
  const discount = product.previousPrice ? Math.round((1 - product.price / product.previousPrice) * 100) : 0;
  return `<div class="price-row"><strong class="price-current">${formatPrice(product.price)}</strong>${product.previousPrice ? `<span class="price-old">${formatPrice(product.previousPrice)}</span><span class="price-discount">-${discount}%</span>` : ""}</div>`;
}

function productCard(product) {
  const saved = state.wishlist.includes(product.id);
  const badgeClass = product.pendingApproval ? "badge-pending" : product.stock === 0 ? "badge-soldout" : product.isNew ? "badge-new" : "";
  const stockLabel = product.pendingApproval ? "Pending owner confirmation" : product.stock === 0 ? "Out of stock" : product.stock <= 4 ? `Only ${product.stock} left` : "In stock";
  const stockClass = product.pendingApproval ? "pending" : product.stock === 0 ? "out" : product.stock <= 4 ? "low" : "";
  const unavailable = product.stock === 0 || product.pendingApproval;
  return `<article class="product-card" data-product="${product.id}">
    <div class="product-media" data-view-product="${product.id}" role="button" tabindex="0" aria-label="Quick view ${product.name}">
      <img src="${imageUrl(product.image)}" alt="${product.name}" loading="lazy">
      ${product.badge ? `<span class="product-badge ${badgeClass}">${product.badge}</span>` : ""}
      <button class="wish-button${saved ? " is-saved" : ""}" type="button" data-wishlist="${product.id}" aria-label="${saved ? "Remove from" : "Add to"} wishlist" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button>
      <button class="quick-view" type="button" data-view-product="${product.id}">Quick look</button>
    </div>
    <div class="product-info"><span class="product-category">${product.category} · ${product.brand}</span><h3>${product.name}</h3><p class="product-description">${product.description}</p>
      ${Number.isFinite(product.rating) && Number.isFinite(product.reviews) ? `<div class="product-rating" aria-label="Rated ${product.rating} out of 5"><span aria-hidden="true">★★★★★</span><span>${product.rating} · ${product.reviews} reviews</span></div>` : ""}
      ${product.pendingApproval ? `<div class="pending-price-reference">${product.priceNote}</div>` : priceMarkup(product)}<div class="stock-status ${stockClass}">${stockLabel}</div>
      <button class="product-add" type="button" data-add-cart="${product.id}" ${unavailable ? "disabled" : ""}>${product.pendingApproval ? "Pending confirmation" : product.stock === 0 ? "Currently unavailable" : "＋ Add to bag"}</button>
    </div>
  </article>`;
}

function renderProducts() {
  renderPills();
  const matches = filteredProducts();
  const shown = matches.slice(0, state.limit);
  $("#product-grid").innerHTML = shown.map(productCard).join("");
  $("#product-grid").hidden = matches.length === 0;
  $("#empty-products").hidden = matches.length > 0;
  $("#search-state").hidden = !state.search && !state.wishlistOnly && !state.dealOnly && !state.newOnly;
  const heading = state.wishlistOnly ? "Your saved picks." : state.dealOnly ? "Selected good deals." : state.newOnly ? "Just landed." : state.search ? `Results for “${state.search}”` : state.category !== "All" ? `${state.category} picks.` : "Popular right now.";
  $("#product-section-title").innerHTML = `${heading.replace(/\.$/, "")} <em>${state.wishlistOnly ? "kept close." : "picked for you."}</em>`;
  $("#search-state").textContent = state.search ? `${matches.length} ${matches.length === 1 ? "find" : "finds"} for “${state.search}”` : state.wishlistOnly ? `${matches.length} saved ${matches.length === 1 ? "item" : "items"}` : state.dealOnly ? "Example offers. Confirm current prices and availability with our team." : "Example catalog. Confirm current prices, stock and device compatibility with our team.";
  $("#product-count-label").textContent = matches.length ? `Showing ${shown.length} of ${matches.length} ${matches.length === 1 ? "product" : "products"}` : "";
  $("#show-more").hidden = matches.length <= shown.length;
  $("#show-more").innerHTML = `Explore all products <span aria-hidden="true">→</span>`;
  $("#empty-products h3").textContent = state.wishlistOnly ? "Your saved list is waiting for its first pick." : "We couldn't find what you're looking for.";
  $("#empty-products p").textContent = state.wishlistOnly ? "Tap the heart on a product to keep it close." : "Try a different search or browse all the good finds.";
}

function renderDealFeature() {
  const product = products.find(item => item.previousPrice && item.stock > 0);
  if (!product) return;
  $("#deal-feature").innerHTML = `<img src="${imageUrl(product.image, 850)}" alt="${product.name}" loading="lazy"><div class="deal-product-info"><span><small>ONE OF THIS WEEK'S FINDS</small><strong>${product.name}</strong></span><b>${formatPrice(product.price)}</b></div>`;
}

function persistCart() {
  saveStorage("noah-cart", state.cart);
  renderCart();
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product || product.stock < 1) return;
  const entry = state.cart.find(item => item.id === id);
  if (entry) entry.quantity = Math.min(entry.quantity + 1, product.stock);
  else state.cart.push({ id, quantity: 1 });
  persistCart();
  showToast(`${product.name} added to your bag.`);
}

function renderCart() {
  state.cart = state.cart.filter(item => products.some(product => product.id === item.id && product.stock > 0));
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + products.find(product => product.id === item.id).price * item.quantity, 0);
  $("#cart-count").textContent = totalItems;
  $("#mobile-cart-count").textContent = totalItems;
  $("#drawer-item-count").textContent = `(${totalItems})`;
  $("#cart-subtotal").textContent = formatPrice(subtotal);
  $("#drawer-empty").style.display = totalItems ? "none" : "grid";
  $("#drawer-summary").style.display = totalItems ? "block" : "none";
  $("#drawer-items").innerHTML = state.cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return `<article class="cart-item"><img src="${imageUrl(product.image, 180)}" alt="" loading="lazy"><div><h3>${product.name}</h3><strong class="cart-item-price">${formatPrice(product.price)}</strong><div class="quantity-control"><button type="button" data-quantity="${product.id}" data-delta="-1" aria-label="Decrease ${product.name} quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity="${product.id}" data-delta="1" aria-label="Increase ${product.name} quantity">+</button></div></div><button class="remove-item" type="button" data-remove-cart="${product.id}" aria-label="Remove ${product.name}">×</button></article>`;
  }).join("");
}

function toggleWishlist(id) {
  state.wishlist = state.wishlist.includes(id) ? state.wishlist.filter(item => item !== id) : [...state.wishlist, id];
  saveStorage("noah-wishlist", state.wishlist);
  $("#wishlist-count").textContent = state.wishlist.length;
  if (state.wishlistOnly) renderProducts();
  else {
    const card = $(`[data-product="${id}"]`);
    const button = $(`[data-wishlist="${id}"]`, card);
    const saved = state.wishlist.includes(id);
    button.classList.toggle("is-saved", saved);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", `${saved ? "Remove from" : "Add to"} wishlist`);
    button.textContent = saved ? "♥" : "♡";
  }
  showToast(state.wishlist.includes(id) ? "Saved for later." : "Removed from your saved picks.");
}

function openCart() {
  $("#drawer-backdrop").hidden = false;
  requestAnimationFrame(() => $("#drawer-backdrop").classList.add("visible"));
  $("#cart-drawer").classList.add("open");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  $(".close-drawer").focus();
}

function closeCart() {
  $("#cart-drawer").classList.remove("open");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
  $("#drawer-backdrop").classList.remove("visible");
  document.body.classList.remove("drawer-open");
  window.setTimeout(() => { if (!$("#cart-drawer").classList.contains("open")) $("#drawer-backdrop").hidden = true; }, 250);
}

function openMenu() {
  $("#mobile-menu").hidden = false;
  $("#menu-backdrop").hidden = false;
  requestAnimationFrame(() => {
    $("#mobile-menu").classList.add("open");
    $("#menu-backdrop").classList.add("visible");
  });
  $("#menu-toggle").setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");
  $("#close-menu").focus();
}

function closeMenu() {
  $("#mobile-menu").classList.remove("open");
  $("#menu-backdrop").classList.remove("visible");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
  window.setTimeout(() => {
    if (!$("#mobile-menu").classList.contains("open")) {
      $("#mobile-menu").hidden = true;
      $("#menu-backdrop").hidden = true;
    }
  }, 280);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  $("#toast-region").append(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function openProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const unavailable = product.stock === 0 || product.pendingApproval;
  const availability = product.pendingApproval ? "Pending owner confirmation" : product.stock ? (product.stock <= 4 ? `Low stock · ${product.stock} left` : "In stock") : "Out of stock";
  $("#product-dialog-content").innerHTML = `<div class="dialog-product"><div class="dialog-product-image"><img src="${imageUrl(product.image, 800)}" alt="${product.name}${product.pendingApproval ? " (illustration; exact product image pending)" : ""}"></div><div class="dialog-product-info"><span class="product-category">${product.category} · ${product.brand}</span><h2 id="dialog-product-name">${product.name}</h2>${Number.isFinite(product.rating) && Number.isFinite(product.reviews) ? `<div class="product-rating"><span aria-hidden="true">★★★★★</span><span>${product.rating} · ${product.reviews} reviews</span></div>` : ""}<p>${product.description}</p><div class="dialog-specs"><span>Product code<strong>${product.id}</strong></span><span>Availability<strong>${availability}</strong></span>${product.specs.map((spec, index) => `<span>${index ? "Details" : "Product notes"}<strong>${spec}</strong></span>`).join("")}</div>${product.pendingApproval ? `<div class="pending-price-reference">${product.priceNote}</div>` : priceMarkup(product)}<button class="product-add" type="button" data-add-cart="${product.id}" ${unavailable ? "disabled" : ""}>${product.pendingApproval ? "Pending confirmation" : product.stock === 0 ? "Currently unavailable" : "＋ Add to bag"}</button><a class="text-link product-question" href="https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(`Hello ${STORE.name}, I have a question about ${product.name} (${product.id}).`)}" target="_blank" rel="noreferrer">Ask us about this product ↗</a></div></div>`;
  $("#product-dialog").showModal();
}

function renderSuggestions() {
  const box = $("#search-suggestions");
  const query = $("#site-search").value.trim().toLowerCase();
  let suggestions;
  if (query) {
    suggestions = products.filter(product => `${product.name} ${product.category} ${product.brand} ${product.id} ${product.keywords}`.toLowerCase().includes(query)).slice(0, 4).map(product => ({ label: product.name, detail: formatPrice(product.price), value: product.name }));
  } else {
    const history = readStorage("noah-search-history", []);
    const defaults = ["Phone charger", "Wireless earbuds", "Flash drive", "USB cable"];
    suggestions = [...history.slice(0, 3).map(value => ({ label: value, detail: "Recent search", value })), ...defaults.filter(value => !history.includes(value)).slice(0, 4).map(value => ({ label: value, detail: "Popular", value }))];
  }
  box.innerHTML = `<div class="suggestion-label">${query ? "Quick finds" : "Popular searches"}</div>${suggestions.length ? suggestions.map(item => `<button class="suggestion-item" type="button" data-search-value="${item.value}"><span>${item.label}</span><span>${item.detail}</span></button>`).join("") : `<div class="suggestion-item">No quick matches. Press Enter to see results.</div>`}`;
  box.hidden = false;
}

function submitSearch(value) {
  const query = value.trim();
  state.search = query;
  state.category = "All";
  state.limit = 8;
  state.wishlistOnly = false;
  state.dealOnly = false;
  state.newOnly = false;
  if (query) {
    const history = readStorage("noah-search-history", []).filter(item => item.toLowerCase() !== query.toLowerCase());
    saveStorage("noah-search-history", [query, ...history].slice(0, 5));
  }
  $("#search-suggestions").hidden = true;
  renderProducts();
  $("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openCheckout() {
  if (!state.cart.length) return;
  closeCart();
  $("#checkout-dialog").showModal();
}

function getServicePaymentDetails(service) {
  const option = SERVICE_OPTIONS[service];
  if (!option) return null;
  const goodsSubtotal = state.cart.reduce((sum, item) => sum + products.find(product => product.id === item.id).price * item.quantity, 0);
  return {
    ...option,
    estimated: option.fee + (service === "buy" ? goodsSubtotal : 0),
    note: service === "buy"
      ? "Estimated payment includes goods in your bag; delivery is confirmed by our team."
      : "Asking and finding services do not include the goods in your bag."
  };
}

function updateServicePaymentInfo() {
  const details = getServicePaymentDetails($("#checkout-service").value);
  const paymentInfo = $("#checkout-payment-info");
  paymentInfo.hidden = !details;
  if (!details) return;
  $("#service-choice-label").textContent = details.label;
  $("#service-fee-amount").textContent = formatPrice(details.fee);
  $("#service-total-amount").textContent = formatPrice(details.estimated);
  $("#service-goods-note").textContent = details.note;
}

function saveOrderToBusinessDesk(formData) {
  const submittedAt = new Date().toISOString();
  const today = submittedAt.slice(0, 10);
  let desk;
  try {
    const storedDesk = localStorage.getItem("noahDigitalStoresDesk_v1");
    desk = storedDesk ? JSON.parse(storedDesk) : null;
    if (!desk || !Array.isArray(desk.requests) || !Array.isArray(desk.suppliers) || !Array.isArray(desk.transactions)) {
      desk = {
        settings: { name: "Noah Digital Stores", tagline: "Unachokitafuta, tunakutafutia.", area: "Tabora", fee: 5000, phone: "", social: "" },
        requests: [], suppliers: [], transactions: []
      };
    }
  } catch {
    return { requestNo: "", saved: false };
  }

  const serviceDetails = getServicePaymentDetails(formData.get("service"));
  const goodsSubtotal = state.cart.reduce((sum, item) => sum + products.find(product => product.id === item.id).price * item.quantity, 0);
  const cartCategories = [...new Set(state.cart.map(item => products.find(product => product.id === item.id).category))].join(", ");
  const productDescription = state.cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return `${product.name} (${product.id}) × ${item.quantity}`;
  }).join("; ");
  const receiptNumber = String(formData.get("receipt-number") || "").trim();
  const customerNotes = [
    `Service: ${serviceDetails.label}`,
    `Goods subtotal: ${formatPrice(goodsSubtotal)}`,
    `Estimated total: ${formatPrice(serviceDetails.estimated)}`,
    `Payment method: ${formData.get("payment")}`,
    `Payment receipt: ${receiptNumber}`,
    `Customer reports paid; verify receipt before marking fee paid.`,
    `Delivery preference: ${formData.get("delivery")}`,
    `Delivery address: ${formData.get("address")}`,
    `Supplier preference: ${formData.get("supplier") || "None provided"}`,
    `Customer notes: ${formData.get("notes") || "None"}`
  ].join("\n");
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const requestNo = `NDS-${submittedAt.slice(0, 4)}-${id.replace(/[^a-z\d]/gi, "").slice(-12).toUpperCase()}`;
  const lineItems = state.cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return { productId: product.id, name: product.name, description: product.description, quantity: item.quantity, unitPrice: product.price, subtotal: product.price * item.quantity };
  });
  const request = {
    id,
    orderId: id,
    no: requestNo,
    orderReference: requestNo,
    submittedAt,
    created: today,
    updated: today,
    customer: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    product: productDescription,
    budget: Number(formData.get("budget") || 0),
    area: String(formData.get("address") || "").trim(),
    category: String(formData.get("category") || cartCategories || "Technology / Electronics"),
    fee: serviceDetails.fee,
    feeStatus: "Haijalipwa",
    status: "Mpya",
    supplierId: "",
    details: String(formData.get("details") || "").trim(),
    notes: `Bag checkout request.\n${customerNotes}`,
    paymentMethod: String(formData.get("payment") || ""),
    receiptNumber,
    deliveryPreference: String(formData.get("delivery") || ""),
    deliveryAddress: String(formData.get("address") || "").trim(),
    orderSubtotal: goodsSubtotal,
    goodsSubtotal,
    estimatedTotal: serviceDetails.estimated,
    totalAmount: serviceDetails.estimated,
    amountPaid: 0,
    outstandingBalance: serviceDetails.estimated,
    paymentStatus: "Unpaid",
    lineItems,
    source: "Main website checkout",
    originalReference: id
  };

  try {
    desk.requests.push(request);
    localStorage.setItem("noahDigitalStoresDesk_v1", JSON.stringify(desk));
    return { requestNo, saved: true, request };
  } catch {
    return { requestNo, saved: false, request };
  }
}

function buildOrderMessage(formData, requestNo) {
  const lines = state.cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    return `• ${product.name} (${product.id}) · ${product.category} × ${item.quantity} — ${formatPrice(product.price * item.quantity)}`;
  });
  const subtotal = state.cart.reduce((sum, item) => sum + products.find(product => product.id === item.id).price * item.quantity, 0);
  const serviceDetails = getServicePaymentDetails(formData.get("service"));
  const cartCategories = [...new Set(state.cart.map(item => products.find(product => product.id === item.id).category))].join(", ");
  const submittedDate = new Date().toISOString().slice(0, 10);
  return [
    `Hello ${STORE.name}, I would like to place an order:`, `Request number: ${requestNo || "Not saved to Desk"}`, `Submitted: ${submittedDate}`, "Request status: New", "", ...lines, "", `Subtotal: ${formatPrice(subtotal)}`,
    `Service required: ${serviceDetails.label}`, `Lipa Number: 251268047`, `Service fee: ${formatPrice(serviceDetails.fee)}`,
    `Estimated payment: ${formatPrice(serviceDetails.estimated)}`, serviceDetails.note,
    `Name: ${formData.get("name")}`, `Phone / WhatsApp: ${formData.get("phone")}`,
    `Product category: ${formData.get("category") || cartCategories || "Not specified"}`,
    `Customer budget: ${formData.get("budget") ? formatPrice(Number(formData.get("budget"))) : "Not specified"}`,
    `Product specifications/details: ${formData.get("details") || "Not provided"}`,
    `Known supplier/store: ${formData.get("supplier") || "Not provided; Noah to identify if needed"}`,
    `Delivery: ${formData.get("delivery")}`, `Area/address: ${formData.get("address") || "To be confirmed"}`,
    `Additional notes: ${formData.get("notes") || "None"}`, `Payment preference: ${formData.get("payment")}`,
    "Service fee status: Customer reports paid; verify receipt",
    `Payment receipt / transaction number: ${formData.get("receipt-number")}`,
    "Customer confirms payment has been completed. Please verify payment with the customer.",
    "Please confirm availability and final delivery/payment details."
  ].join("\n");
}

function updateProductFilter(options) {
  state.search = "";
  state.limit = 8;
  state.wishlistOnly = false;
  state.dealOnly = false;
  state.newOnly = false;
  state.category = options.category || "All";
  $("#site-search").value = "";
  $("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
  renderProducts();
}

function bindEvents() {
  $("#search-form").addEventListener("submit", event => { event.preventDefault(); submitSearch($("#site-search").value); });
  $("#site-search").addEventListener("input", event => {
    state.search = event.target.value.trim();
    state.category = "All";
    state.wishlistOnly = false;
    state.dealOnly = false;
    state.newOnly = false;
    state.limit = 8;
    renderProducts();
    renderSuggestions();
  });
  $("#site-search").addEventListener("focus", renderSuggestions);
  document.addEventListener("click", event => {
    if (!event.target.closest(".search-form")) $("#search-suggestions").hidden = true;
    const add = event.target.closest("[data-add-cart]");
    if (add) addToCart(add.dataset.addCart);
    const wish = event.target.closest("[data-wishlist]");
    if (wish) { event.stopPropagation(); toggleWishlist(wish.dataset.wishlist); return; }
    const view = event.target.closest("[data-view-product]");
    if (view) openProduct(view.dataset.viewProduct);
    const categoryCard = event.target.closest("[data-category]");
    if (categoryCard) { event.preventDefault(); updateProductFilter({ category: categoryCard.dataset.category }); }
    const categoryPill = event.target.closest("[data-filter-category]");
    if (categoryPill) updateProductFilter({ category: categoryPill.dataset.filterCategory });
    const suggestion = event.target.closest("[data-search-value]");
    if (suggestion) { $("#site-search").value = suggestion.dataset.searchValue; submitSearch(suggestion.dataset.searchValue); }
    const quantityButton = event.target.closest("[data-quantity]");
    if (quantityButton) {
      const item = state.cart.find(entry => entry.id === quantityButton.dataset.quantity);
      const product = products.find(entry => entry.id === quantityButton.dataset.quantity);
      if (item) {
        item.quantity = Math.min(product.stock, item.quantity + Number(quantityButton.dataset.delta));
        if (item.quantity < 1) state.cart = state.cart.filter(entry => entry.id !== item.id);
        persistCart();
      }
    }
    const removeButton = event.target.closest("[data-remove-cart]");
    if (removeButton) { state.cart = state.cart.filter(item => item.id !== removeButton.dataset.removeCart); persistCart(); }
    const dealLink = event.target.closest("[data-set-deal]");
    if (dealLink) { event.preventDefault(); updateProductFilter({}); state.dealOnly = true; renderProducts(); $("#shop").scrollIntoView({ behavior: "smooth" }); }
    const newLink = event.target.closest("[data-set-new]");
    if (newLink) { event.preventDefault(); updateProductFilter({}); state.newOnly = true; renderProducts(); $("#shop").scrollIntoView({ behavior: "smooth" }); }
  });
  $("#sort-products").addEventListener("change", event => { state.sort = event.target.value; renderProducts(); });
  $("#show-more").addEventListener("click", () => { state.limit = products.length; renderProducts(); });
  $("#show-all").addEventListener("click", event => { event.preventDefault(); updateProductFilter({}); state.limit = products.length; renderProducts(); });
  $("#reset-filters").addEventListener("click", () => updateProductFilter({}));
  $("#wishlist-trigger").addEventListener("click", () => {
    state.wishlistOnly = !state.wishlistOnly;
    state.search = ""; state.category = "All"; state.dealOnly = false; state.newOnly = false; state.limit = 8;
    renderProducts(); $("#shop").scrollIntoView({ behavior: "smooth" });
  });
  $("#cart-trigger").addEventListener("click", openCart);
  $("#mobile-cart-button").addEventListener("click", openCart);
  $(".close-drawer").addEventListener("click", closeCart);
  $("#drawer-backdrop").addEventListener("click", closeCart);
  $("#drawer-shop").addEventListener("click", () => { closeCart(); $("#shop").scrollIntoView({ behavior: "smooth" }); });
  $("#checkout-button").addEventListener("click", openCheckout);
  $("#checkout-service").addEventListener("change", updateServicePaymentInfo);
  $(".payment-confirmation").addEventListener("change", event => {
    if (event.target.name !== "payment-confirmed") return;
    const receiptField = $("#receipt-number-field");
    const receiptInput = $("[name='receipt-number']", receiptField);
    const isPaid = event.target.value === "yes";
    receiptField.hidden = !isPaid;
    receiptInput.disabled = !isPaid;
    receiptInput.required = isPaid;
    if (!isPaid) receiptInput.value = "";
  });
  $("#checkout-form").addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get("payment-confirmed") !== "yes" || !String(formData.get("receipt-number") || "").trim()) {
      showToast("Confirm payment and enter its receipt number before sending the order.");
      return;
    }
    const deskRecord = saveOrderToBusinessDesk(formData);
    const message = buildOrderMessage(formData, deskRecord.requestNo);
    window.open(`https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    $("#checkout-dialog").close();
    $("#confirmation-reference").textContent = deskRecord.requestNo || "Not available";
    $("#confirmation-save-status").textContent = deskRecord.saved
      ? "Your order is saved in this browser's Business Desk. Noah will verify any reported payment separately. This record does not sync to other devices."
      : "This browser could not save the order. Please include the reference in WhatsApp and contact Noah directly.";
    $("#order-confirmation").showModal();
  });
  $(".checkout-close").addEventListener("click", () => $("#checkout-dialog").close());
  $(".order-confirmation-close").addEventListener("click", () => $("#order-confirmation").close());
  $(".dialog-close").addEventListener("click", () => $("#product-dialog").close());
  $("#product-dialog").addEventListener("click", event => { if (event.target === $("#product-dialog")) $("#product-dialog").close(); });
  $("#checkout-dialog").addEventListener("click", event => { if (event.target === $("#checkout-dialog")) $("#checkout-dialog").close(); });
  $("#order-confirmation").addEventListener("click", event => { if (event.target === $("#order-confirmation")) $("#order-confirmation").close(); });
  $("#menu-toggle").addEventListener("click", openMenu);
  $("#close-menu").addEventListener("click", closeMenu);
  $("#menu-backdrop").addEventListener("click", closeMenu);
  $("#mobile-menu").addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
  $("#mobile-search-button").addEventListener("click", () => {
    $("#site-search").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderSuggestions();
  });
  $("#product-grid").addEventListener("keydown", event => {
    const media = event.target.closest("[data-view-product]");
    if (media && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openProduct(media.dataset.viewProduct); }
  });
}

function rotateAnnouncements() {
  const messages = ["Quality electronics & accessories in Tabora", "Useful tech for work, home & life on the move", "Find your everyday essentials at Noah Digital Store", "Questions about a product? We're happy to help"];
  let index = 0;
  window.setInterval(() => {
    index = (index + 1) % messages.length;
    const message = $("#announcement-message");
    message.style.opacity = "0";
    window.setTimeout(() => { message.textContent = messages[index]; message.style.opacity = "1"; }, 180);
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();
  configureContactLinks();
  renderCategories();
  renderDealFeature();
  renderProducts();
  renderCart();
  $("#wishlist-count").textContent = state.wishlist.length;
  bindEvents();
  rotateAnnouncements();
  window.initNoahTranslations({ defaultLanguage: "en" });
});
