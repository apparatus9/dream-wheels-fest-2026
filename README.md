# Dream Wheels on Eglinton Fest 2026 — booth raffle form

Landing page + raffle entry form for the 4th Annual Dream Wheels on Eglinton Fest
(Saturday July 25, 2026 · 533 Eglinton Ave W, Toronto · in support of SickKids).

Attendees scan a QR at the booth, land here, and enter to win **free oil for life**.
Results are announced on Instagram, so the form captures their handle and a follow confirmation.

**No build step.** `index.html` is entirely self-contained — open it, or drop the folder
on any static host.

## Quick start

See **[SETUP.md](SETUP.md)** for the click-by-click version. Short form:

1. `copy config.example.js config.js`, then set `igHandle` in it.
2. Paste `google-apps-script.gs` into a Google Sheet (Extensions → Apps Script), deploy as
   a Web App with access set to **Anyone**, and put the `/exec` URL in `submitEndpoint`
   in `config.js`.
3. Deploy the folder, then `npm install qrcode && node generate-qr.js <live-url>` to make
   the printable booth QR sign.

## Configuration

Settings live in **`config.js`**, which is **gitignored** — it is never committed.
`config.example.js` is the committed template showing what to fill in.

Because it's gitignored, `config.js` won't arrive via `git clone` or a git-linked deploy —
**upload it to your host manually** alongside `index.html`. If it's absent the page still
loads and works; it just uses placeholder defaults and saves entries on-device only.

> **On secrecy, honestly:** this is a static page, so whatever URL you put in `config.js`
> is readable in the deployed page's source by anyone who looks. Keeping it out of git
> isn't about hiding it from visitors — it's so the URL never becomes a permanent part of
> public git history. The Apps Script endpoint can only *append rows*, so the worst case
> if someone finds it is junk entries. If that ever happens: in Apps Script go to
> **Deploy → Manage deployments → Archive**, create a new deployment to get a fresh
> `/exec` URL, and update `config.js`.

## Files

| File | What it is |
|---|---|
| `index.html` | The entire landing page + 3-step form. The deliverable. |
| `config.example.js` | Template for `config.js`. Committed. |
| `config.js` | Your real settings. **Gitignored, never committed.** |
| `google-apps-script.gs` | Google Sheet collector + random winner picker. |
| `generate-qr.js` | Booth QR code + printable branded sign. |
| `SETUP.md` | Full setup, booth-day operating notes, and the legal reasoning. |

## Notes

- **Entries survive dead wifi.** Each submission is written to device storage before upload;
  failures queue and retry automatically when the connection returns.
- **Emergency export:** append `#export` to the URL to download a CSV of entries stored on
  that device.
- **Compliance:** includes a skill-testing question (Criminal Code s.206) and a CASL
  express-consent checkbox. Reasoning is documented in SETUP.md.
- The page can't read the Apps Script response back (no CORS), so **always send one test
  entry and confirm the row lands in the Sheet** after deploying.
