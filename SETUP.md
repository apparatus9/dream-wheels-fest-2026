# Dream Wheels Fest 2026 — booth raffle form

Everything is in **`index.html`**. One file, no build step. Open it by double-clicking to preview.

---

## Before tomorrow — 3 things (about 15 min total)

### 1. Set your Instagram handle  ⏱ 30 seconds

All confidential/config values live in **`config.js`**, which is gitignored — it never
gets committed to GitHub. If you don't have one yet, make it from the template:

```bash
copy config.example.js config.js
```

Open `config.js` and set your handle:

```js
window.DWF_CONFIG = {
  igHandle: 'dreamwheelsfest',   // <-- your handle, WITHOUT the @
  submitEndpoint: '',
  eventCode: 'DW26'
};
```

This drives the Follow button on step 2 and the big Follow button on the thank-you screen.

> ⚠️ Because `config.js` is gitignored, it will **not** come down from a `git clone` or a
> git-linked deploy. You must upload it to your host alongside `index.html`. If it's
> missing the page still loads and still works — it just falls back to the placeholder
> handle and saves entries on-device only.

---

### 2. Hook up the entry sheet  ⏱ 5 minutes

Without this the form still works and still saves entries **on the phone/tablet it was
filled on**, but you won't get a central spreadsheet. Do this one.

1. Go to <https://sheets.new> — a blank Google Sheet. Name it "Dream Wheels Entries".
2. **Extensions → Apps Script**.
3. Delete whatever is in the editor. Paste in the entire contents of `google-apps-script.gs`.
4. Save (💾).
5. **Deploy → New deployment**. Click the ⚙️ next to "Select type" → **Web app**.
   - Description: `entries`
   - **Execute as: Me**
   - **Who has access: Anyone**  ← this one matters, it won't work otherwise
6. **Deploy**. Google will ask you to authorize — click through
   *Advanced → Go to (project) → Allow*. This warning is normal for your own scripts.
7. Copy the **Web app URL**. It ends in `/exec`.
8. Paste it into `submitEndpoint` in **`config.js`** (not `index.html`):

```js
submitEndpoint: 'https://script.google.com/macros/s/AKfy..../exec',
```

Submit a test entry. A row should appear in the sheet within a second or two.

> If you ever edit the Apps Script, you must **Deploy → Manage deployments → ✏️ → New version**
> for the change to go live. Editing alone doesn't update the URL.

---

### 3. Put it online + make the QR  ⏱ 5 minutes

The page has to be on a real URL for people to scan it. Easiest free options:

**Netlify Drop** (no account needed to start): go to <https://app.netlify.com/drop>
and drag this whole folder onto the page. You get a live URL instantly.

**Cloudflare Pages**: `npx wrangler pages deploy . --project-name=dream-wheels-fest --branch=main`

**Vercel**: `npm i -g vercel` then `vercel --prod` in this folder.

> Heads up from your notes: Cloudflare Pages projects created by direct upload do **not**
> auto-deploy from git pushes. If you change `index.html` later, re-run the deploy command.

Then generate the booth QR:

```bash
npm install qrcode
node generate-qr.js https://your-live-url.com
```

That writes `qr.svg` (print this), `qr.png`, and `qr.html` — a branded, ready-to-print
booth sign. Open `qr.html` and hit Ctrl+P.

**Scan the printed QR with your own phone before you print 20 of them.**

---

## What the form asks

| Field | Required | Why |
|---|---|---|
| First / last name | ✅ | Identify the winner |
| Email | ✅ | Contact the winner |
| Phone | — | Optional, faster to reach on the day |
| Current car | ✅ | You asked for it — also great post-event content |
| Instagram handle | ✅ | Your results go out on IG; you need this to verify the follow and DM them |
| "I followed the page" | ✅ | The mechanic you described |
| Skill-testing question | ✅ | See below |
| 18+ / Ontario resident | ✅ | Prize eligibility |
| Email consent | ✅ | See below |

### Why the skill-testing question
Under s.206 of the Criminal Code, a prize contest in Canada that's pure chance is
technically an illegal lottery. Adding a skill-testing question (the standard is a
four-step arithmetic problem — which is exactly what's generated) is what makes it a
legal contest. It's the reason every Tim Hortons and radio-station contest has one.
A fresh question is generated for each entrant.

### Why the consent checkbox
CASL — Canada's anti-spam legislation. If you want to email these people afterward about
next year's fest, you need express consent recorded at the moment you collected the address.
You cannot go back and get it later for 300 addresses. The sheet logs a Yes/No per entrant,
which is your proof if it's ever questioned.

I am not a lawyer and this isn't legal advice — but these two checkboxes cost you nothing
and are what every Canadian promo runs.

---

## Running the booth

**Entries never get lost, even if the wifi dies.** Every submission is written to the
device's local storage *before* it tries to upload. If the network is down, it queues and
auto-uploads when the connection comes back.

- **"Enter someone else →"** on the thank-you screen resets the form for the next person
  in line. That's the button to hand back with the phone/tablet.
- **Emergency CSV export**: add `#export` to the end of the URL and load it — downloads
  every entry stored on *that device*. Use this if the Sheet connection failed.
- **Duplicate guard**: the same email can't be entered twice on the same device.

## Drawing the winner

In the Google Sheet, use the **🏁 Dream Wheels → Draw a winner** menu (it appears after
you reload the sheet once the script is installed). It picks one random entry from
everyone who confirmed 18+ *and* confirmed the follow, and shows you their name, ticket
number, Instagram handle and contact info.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The whole landing page + form. This is the deliverable. |
| `google-apps-script.gs` | Paste into your Google Sheet. Collects entries + draws the winner. |
| `generate-qr.js` | Makes the booth QR code and a printable sign. |
| `SETUP.md` | This file. |
