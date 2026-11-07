# NOAH Digital Store Business Desk

A local Windows dashboard backed by an Excel workbook on the same computer. It includes order management, manual TIPS payment verification, PDF receipts, WhatsApp click-to-chat confirmation, customer records, reports, workbook import/export, and automatic local backups.

## Project files

- `index.html`, `style.css`, `script.js`: responsive dashboard.
- `server.js`: local API, administrator authentication, Excel persistence, validation, audit history, backups, and PDF receipts.
- `NOAH_DIGITAL_STORE_DATABASE.xlsx`: downloadable blank workbook template with eight worksheets.
- `receipt-template.html`: print-friendly receipt design reference.
- `data/NOAH_DIGITAL_STORE_DATABASE.xlsx`: primary live workbook, generated on first start.
- `data/backups/`: automatic pre-write workbook backups, retaining the newest 50.

## Run on Windows

Install Node.js 20 or newer. Open PowerShell in this folder and run:

```powershell
npm.cmd install
npm.cmd start
```

The private `.env` file controls administrator login and is excluded from Git. With `NOAH_LOGIN_REQUIRED=false`, the desk opens without a login; anyone who can use this Windows account can manage its records. Keep the server bound to localhost and protect access to the computer. To require a login again, set `NOAH_LOGIN_REQUIRED=true` and set `NOAH_ADMIN_PASSWORD` to a unique password of at least 12 characters, then restart. Keep the terminal open while using the desk, then browse to [http://127.0.0.1:4177](http://127.0.0.1:4177). Open the connected Bag Form at [http://127.0.0.1:4177/store/](http://127.0.0.1:4177/store/) or use the dashboard's **Open Bag Form** button. Orders submitted from this local URL are posted to the same-origin API and saved to the Excel workbook. Opening the storefront as a `file:///` URL or from a different host does not use this local endpoint. The backend binds to localhost by default; it is not exposed to the local network or the internet. Orders and dashboard updates are written to `data/NOAH_DIGITAL_STORE_DATABASE.xlsx`. The Excel workbook is the primary store; if it is missing, a fresh workbook is created from the template.

To stop the desk, press Ctrl+C in its terminal. The local workbook remains available for the next run. Protect the Windows account and disk with a strong sign-in and BitLocker; the workbook contains customer data and is not encrypted by the application.

## Workbook worksheets

`Customers`, `Orders`, `Payments`, `Products`, `Receipts`, `Order Tracking`, `Settings`, and `Reports`. The dashboard provides Excel download, validated merge-import, dated automatic backups, and backup recovery upload. Imports must include all eight sheets and required headers. Records are merged using their stable IDs so unrelated existing rows are retained.

## Website order synchronization

A static public website cannot reach a computer that is offline or only listening on `127.0.0.1`. The Business Desk intentionally does not claim that it can. For live website submissions to reach this local workbook, the host computer must be online and a trusted network path must reach the local API over HTTPS or an authenticated VPN. The server must also be running. When the path is available, the customer browser posts the order directly to `/api/orders`; when the local site setting is blank, the storefront retains its browser-local queue instead.

For deployment, configure a reputable HTTPS reverse proxy or VPN ingress to forward only `POST /api/orders` to `127.0.0.1:4177`. Do not expose the dashboard's administrator endpoints to the public internet. Restrict public paths and methods at the proxy, use TLS, keep the host patched, and set an exact origin allowlist in PowerShell before starting the server:

```powershell
$env:ALLOWED_ORIGINS = 'https://kisanjik-cyber.github.io'
$env:NOAH_TRUST_PROXY = '1'
```

Set `NOAH_TRUST_PROXY=1` only when there is exactly one trusted reverse proxy in front of this process and that proxy overwrites forwarded headers. The website origin is the scheme and hostname only, without the page path. The dashboard checks the local workbook every 20 seconds while its tab is visible. Then edit the root storefront `index.html` setting before publishing:

```html
<script>window.NOAH_ORDER_API = 'https://your-approved-host.example/api/orders';</script>
```

Use only an HTTPS endpoint in production. Do not put an administrator password or secret in the public website. The public intake endpoint validates service fees and fields, rejects Pay on Delivery for non-sourcing services, rate-limits submissions, and treats each order ID idempotently. CORS origin checks are browser controls, not user authentication; the reverse proxy should expose only the required public order intake path. If the computer, VPN, proxy or server is offline, public submissions cannot be synchronized to the local workbook at that time. The customer should retry when the connection is restored.

## Payment verification and order confirmation

The Bag Form records the TIPS transaction reference and initially sets payment to **Pending**. Staff must compare the reference and prepaid service fee against the actual TIPS payment record, then set the payment to **Verified** or **Rejected** in Payment Verification. The desk never verifies a payment based solely on a customer-entered reference. Confirm Order is enabled only after the service fee is verified. For sourcing orders, the service fee is separate from the product price; Pay on Delivery applies only to the actual product amount.

After confirmation, the WhatsApp button opens a personalized click-to-chat draft addressed to the customer's normalized Tanzanian number (`+255`); staff must review and press Send. The system does not send SMS or email. WhatsApp Business Cloud API sending is not configured.

## Privacy and recovery

Administrator API routes require a session established by the password prompt. The password is supplied through the Windows environment and is not saved in this project. Backups are made before workbook writes and retained locally. Use Excel Database > Download Excel database for an export. To recover, upload a known-good backup in the dashboard's recovery control. Store backups in an access-controlled Windows profile and make a separate offline copy according to NOAH's retention policy.

The system continues to manage existing records offline when run locally. Online website intake cannot arrive while the host computer or its approved network path is offline. No online database is used as the order database.


## Shop ↔ Desk connection (updated)

- Run `ANZA-BUSINESS-DESK.bat` (in the main folder). The desk opens at http://127.0.0.1:4177/ and the shop at http://127.0.0.1:4177/store/.
- Orders placed on the shop at `/store/` go straight into the desk (New Orders). If the desk is off, the order is kept on the customer's device and is sent automatically later.
- For the public website, publish the desk over HTTPS and put its address in `index.html` (`window.NOAH_ORDER_API = 'https://…/api/orders'`). `ALLOWED_ORIGINS` in `.env` already allows the GitHub Pages site.
- In an order, press **Verify payment & confirm**, then **Tuma WhatsApp kwa mteja** to message the customer's number.
