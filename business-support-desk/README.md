# NOAH DIGITAL STORES Business Desk

## Open the desk

After the existing GitHub Pages site publishes this folder, open:

[https://kisanjik-cyber.github.io/noahdigstore/business-support-desk/](https://kisanjik-cyber.github.io/noahdigstore/business-support-desk/)

No web server or Apps Script deployment is used. The staff desk connects directly to an Excel workbook in OneDrive using Microsoft sign-in. On first connection it creates **NOAH Digital Stores Business Desk.xlsx** with Orders, Customers, Payments, Receipts, Products, Business Settings and Activity Logs sheets.

## One-time Microsoft setup

1. In Microsoft Entra admin center, register a **single-page application** for the staff desk. Select the account type appropriate for the business OneDrive account.
2. Add the published desk URL above as a **Web** redirect URI. For local testing, also add `http://localhost:8000/business-support-desk/`.
3. Add delegated Microsoft Graph permissions `User.Read` and `Files.ReadWrite`, then grant consent as required by the tenant.
4. Open **Settings & Excel connection** in the desk. Enter the application (client) ID and tenant ID, then choose **Save connection details and sign in**.
5. Sign in with the staff Microsoft work/school account that owns the OneDrive workbook. Do not enter or create a client secret. The client ID is public app configuration; the access token is obtained by Microsoft sign-in and is not embedded in source.

Excel workbook APIs require a supported OneDrive for Business / work-or-school account. Personal Microsoft accounts may not support the workbook API used here. If your tenant blocks app registrations or Graph permissions, an administrator must approve them.

## Orders and WhatsApp

Website checkout saves the full bag submission in the shared same-origin browser store before opening the customer's WhatsApp draft. If the desk is open in another tab, the order appears automatically; when staff are signed into Excel, that storage update is queued to the workbook. If the desk was closed, it merges browser-only orders into Excel on connection, and it silently resumes the sync on desk load when a Microsoft session is still cached. Orders that arrive from another customer's device cannot be written into a private OneDrive workbook by a public static page. Staff should use **Add off-site WhatsApp order** only for orders received outside the website.

Automatic public checkout-to-Excel capture across devices requires a secured backend connector. This version deliberately has no server deployment or public write credential. It uses a staff-authenticated OneDrive connection instead.

Order actions can prepare WhatsApp click-to-chat drafts; staff must review and press **Send**. Receipt generation opens a printable receipt page. Choose **Print / Save PDF** in the browser, then attach that PDF to WhatsApp manually if required. A static page cannot host a private, shareable receipt URL without a backend.

## Sync and local recovery

When connected, desk changes are written to the OneDrive workbook. The browser also keeps a local cache and a pending copy for reconnect after an interruption. Use **Refresh** to reload the workbook. Use **Settings & backup** to export or restore a JSON backup. Do not use a shared/public device; the desk has no independent administrator password and local cached data is visible to users of that browser profile.

## Local test

Run the static site from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/business-support-desk/` and add it as a redirect URI in Entra before testing sign-in. Deployments should use the existing GitHub Pages workflow; no additional web server is required.
