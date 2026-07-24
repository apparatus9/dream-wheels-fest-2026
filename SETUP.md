# Dream Wheels Fest 2026 — booth raffle form

The form itself is **`index.html`** — one self-contained file, no build step.
Entries are stored in **Firebase Firestore**.

```
  Phone at the booth          GitHub Pages            Firebase Firestore
  ──────────────────          ────────────            ──────────────────
  scans QR                    serves the page
  fills the form
  hits "Enter the draw" ─────────────────────────────▶ entry saved
        │                                                     │
        └── also saved on the phone                            └── node draw.js --draw
            as a backup if wifi dies                               picks the winner
```

Two free services, two different jobs. GitHub Pages serves the **page**;
Firestore stores the **data**. You need both.

---

## Before the event — 4 steps (~20 min)

### 1. Create the Firebase project  ⏱ 5 min

1. Go to <https://console.firebase.google.com> → **Create a project**.
   Name it `dream-wheels-fest`. Google Analytics is not needed — turn it off.
2. In the left sidebar: **Build → Firestore Database → Create database**.
3. Location: pick **`northamerica-northeast2` (Toronto)**.
4. When it asks for a starting mode, choose **Start in production mode**.
   (We replace the rules in step 2 anyway. Do **not** pick test mode — see the
   warning there.)

### 2. Lock down the security rules  ⏱ 2 min — do not skip

In **Firestore Database → Rules**, delete what's there, paste in the entire
contents of **`firestore.rules`** from this folder, and click **Publish**.

> ⚠️ **Why this matters.** Firestore's "test mode" rules are `allow read, write: if true`
> — that means *anyone on the internet* could download every entrant's name, email
> and phone number. The rules in `firestore.rules` allow the public to **create** an
> entry and nothing else: no reading, no editing, no deleting. Your entrant list
> stays private, and you read it as the owner via `draw.js`.

### 3. Wire the form to it  ⏱ 3 min

1. In Firebase, click **⚙ Project settings → General**.
2. Under **Your apps**, click the **web** icon (`</>`) to register a web app.
   Nickname it `booth-form`. Skip Firebase Hosting.
3. It shows you a `firebaseConfig` block. You only need two values from it:
   `projectId` and `apiKey`.
4. Make your local config file if you don't have one, then fill it in:

```bash
copy config.example.js config.js
```

```js
window.DWF_CONFIG = {
  igHandle: 'your_real_handle',      // <-- WITHOUT the @
  eventCode: 'DW26',
  firebase: {
    projectId: 'dream-wheels-fest-xxxxx',
    apiKey: 'AIzaSy................................',
    collection: 'entries'
  }
};
```

> **On the apiKey:** it is *not* a secret and it's fine that it ends up visible in
> the deployed page — that's how every Firebase web app works. It identifies your
> project; it doesn't grant access. Your rules from step 2 are what grant access.
> `config.js` is gitignored anyway so it stays out of public git history.

> ⚠️ Because `config.js` is gitignored it will **not** arrive via `git clone` or a
> git-linked deploy. If you deploy from GitHub, see the note in step 4.

### 4. Put it online and print the QR  ⏱ 8 min

**Option A — GitHub Pages** (free, you're already on GitHub):
`Settings → Pages → Source: Deploy from a branch → main / (root) → Save`.
Live in ~1 min at `https://apparatus9.github.io/dream-wheels-fest-2026/`.

Because `config.js` is gitignored, GitHub Pages won't have your settings. Either
commit it (`git add -f config.js`) — harmless, since neither value is secret and
your rules do the protecting — or use Option B.

**Option B — upload from your disk** (keeps `config.js` out of git entirely):
drag this folder onto <https://app.netlify.com/drop>, or run `vercel --prod`.

Then generate the booth QR:

```bash
npm install
node generate-qr.js https://your-live-url.com
```

That writes `qr.svg` (print this one), `qr.png`, and `qr.html` — a branded,
ready-to-print booth sign. Open `qr.html` and hit Ctrl+P.

**Scan the printed QR with your own phone before you print twenty of them.**

---

### ✅ Then test it end to end

Open the live URL, submit a real entry, and confirm it appears in
**Firebase console → Firestore Database → `entries`**.

Unlike the old spreadsheet approach, the form now gets a real answer back from
the server. If a save fails you'll see a **"Saved on device — check booth setup"**
toast at the bottom of the screen, and the reason is logged to the browser console.
No news is good news.

---

## What the form asks

| Field | Required | Why |
|---|---|---|
| First / last name | ✅ | Identify the winner |
| Email | ✅ | Contact the winner |
| Phone | — | Optional, faster to reach on the day |
| Current car | ✅ | You asked for it — also great post-event content |
| Instagram handle | ✅ | Results go out on IG; needed to verify the follow and DM them |
| "I followed the page" | ✅ | The mechanic you described |
| Skill-testing question | ✅ | See below |
| 18+ / Ontario resident | ✅ | Prize eligibility |
| Email consent | ✅ | See below |

### Why the skill-testing question
Under s.206 of the Criminal Code, a prize contest in Canada decided purely by
chance is technically an illegal lottery. A skill-testing question — the standard
being a four-step arithmetic problem, which is exactly what's generated — is what
makes it a legal contest. It's why every Tim Hortons and radio contest has one.
A fresh question is generated for each entrant.

### Why the consent checkbox
CASL, Canada's anti-spam legislation. To email these people later about next
year's fest you need express consent recorded at the moment you collected the
address. You can't go back and get it afterward for 300 addresses. Each entry
stores a Yes/No, and `draw.js` tells you how many consented.

I'm not a lawyer and this isn't legal advice — but these two checkboxes cost
nothing and are what every Canadian promo runs.

---

## Running the booth

**Entries can't be lost, even if the wifi dies.** Every submission is written to
the device's storage *before* it tries to upload. If the network is down it queues
and uploads automatically when the connection returns.

- **"Enter someone else →"** on the thank-you screen resets the form for the next
  person in line. That's the button to hand back with the phone or tablet.
- **Emergency CSV export:** add `#export` to the end of the URL and load it —
  downloads every entry stored on *that device*. Your safety net if Firebase was
  misconfigured all day.
- **Duplicate guard:** the same email can't be entered twice on the same device.

## Reading entries and drawing the winner

One-time setup, so you can read the database from your laptop:

1. Firebase console → **⚙ Project settings → Service accounts**
2. **Generate new private key** → a `.json` file downloads
3. Rename it `serviceAccount.json` and put it in this folder
4. `npm install`

> 🔐 **This file is a real secret** — unlike the apiKey, it grants full admin
> access to your database. It's gitignored. Don't email it or commit it. If it
> ever leaks, revoke it on that same Service accounts page.

Then:

```bash
node draw.js          # list all entries + totals
node draw.js --csv    # export entries.csv
node draw.js --draw   # 🏆 pick a random winner
```

`--draw` only considers entries that confirmed **18+** *and* confirmed the
**Instagram follow**, and prints the winner's name, ticket number, handle and
contact details.

---

## Files

| File | In git? | What it is |
|---|---|---|
| `index.html` | ✅ | The entire landing page + 3-step form. The deliverable. |
| `firestore.rules` | ✅ | Security rules. Paste into Firebase. **Don't skip.** |
| `config.example.js` | ✅ | Template for `config.js`. |
| `config.js` | 🔒 ignored | Your handle + Firebase projectId/apiKey. |
| `serviceAccount.json` | 🔒 ignored | Firebase admin key. **Real secret.** You create this. |
| `draw.js` | ✅ | List entries, export CSV, draw the winner. |
| `generate-qr.js` | ✅ | Booth QR code + printable branded sign. |
| `package.json` | ✅ | Dependencies for `draw.js` and `generate-qr.js`. |
