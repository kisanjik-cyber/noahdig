# NOAH Digital Store

A responsive, account-free electronics storefront with a blue, cream and yellow visual identity. Open `index.html` directly in a browser to use the current demo; no install or build step is required.

## Bag Form and order handling

- The Bag Form offers product inquiry and seller/shop price research (TSh 1,000), product price research (TSh 2,000), and product sourcing and delivery (TSh 5,000). The initial fee is paid to TIPS number `251268047`; customers enter a transaction reference and payment date, and orders remain **Pending Verification** until NOAH confirms payment.
- Pay on delivery is offered only for sourcing orders and applies to the actual product amount, not the prepaid service fee. A PDF receipt is generated after submission, and WhatsApp sharing remains available.
- With no endpoint configured, orders remain in same-browser storage and are not permanent or cross-device. A configured local Business Desk endpoint stores submissions in its Excel workbook, but only while the host computer, server, and approved network path are reachable.

## Local Business Desk

The local dashboard and Excel-backed backend are in [business-support-desk/README.md](business-support-desk/README.md). When `window.NOAH_ORDER_API` is configured in this page, Bag Form submissions are sent directly to that endpoint. Leave it blank for the browser-local fallback. A local Excel file cannot receive public orders while its host computer or approved network connection is offline.

## Before taking real orders

- Replace the sample products, prices, stock, specifications, brands, and Unsplash image URLs in `app.js` with verified NOAH catalog data and properly licensed product photos.
- Confirm the WhatsApp/support number in both `index.html` and the `STORE` object in `app.js` before publishing. The current number is supplied as a demo contact.
- Connect the order flow to a trusted server before collecting real customer details or relying on it for permanent records. The browser queue is a same-browser handoff to the desk, not a backend database.
- Configure a trusted TIPS payment verification process. The site never marks an order paid based only on a customer-entered reference.
- Replace sample catalog, prices and contact information with verified business data before launch.

The catalog is illustrative and does not guarantee live availability. Customers do not need an account or registration.
