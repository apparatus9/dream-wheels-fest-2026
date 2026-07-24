# Dream Wheels on Eglinton Fest 2026 — booth raffle form

Landing page + raffle entry form for the 4th Annual Dream Wheels on Eglinton Fest
(Saturday July 25, 2026 · 533 Eglinton Ave W, Toronto · in support of SickKids).

Attendees scan a QR at the booth, land here, and enter to win **free oil for life**.
Results are announced on Instagram, so the form captures their handle and a follow
confirmation.

**No build step.** `index.html` is entirely self-contained — no frameworks, no
external scripts. Open it, or drop the folder on any static host.

```
  Phone at the booth          Static host             Firebase Firestore
  ──────────────────          ───────────             ──────────────────
  scans QR                    serves the page
  fills the form
  hits "Enter the draw" ─────────────────────────────▶ entry saved
        │                                                     │
        └── also saved on the phone                            └── node draw.js --draw
            as a backup if wifi dies                               picks the winner
```

## Quick start

Full click-by-click version in **[SETUP.md](SETUP.md)**. Short form:

1. Create a Firebase project, enable Firestore, and **paste `firestore.rules` into
   Firestore → Rules → Publish**.
2. `copy config.example.js config.js`, then fill in your Instagram handle plus the
   Firebase `projectId` and `apiKey`.
3. Deploy the folder, then `npm install && node generate-qr.js <live-url>` to make
   the printable booth QR sign.
4. Submit one test entry and confirm it lands in Firestore.

## Features

- **Single self-contained file** — no build, no framework, no CDN dependencies.
  Talks to Firestore over its REST API.
- **Entries survive dead wifi.** Each submission is written to device storage
  *before* upload; failures queue and retry when the connection returns. A booth
  with bad signal never costs you an entry.
- **Real delivery confirmation.** Firestore returns actual success/error, so a
  broken setup surfaces a warning instead of failing silently.
- **Emergency export** — append `#export` to the URL for a CSV of entries stored
  on that device.
- **Duplicate guard** per device, and a reset button for the next person in line.
- **Mobile-first**: 16px inputs (no iOS zoom-on-focus), correct `inputmode` and
  `autocomplete` per field, thumb-sized targets, `overscroll-behavior` locked.
- **Accessible**: real labels, `aria-invalid`, live-region status, managed focus
  between steps, and `prefers-reduced-motion` respected.
- **Compliance built in** — skill-testing question (Criminal Code s.206) and a
  CASL express-consent checkbox. Reasoning documented in SETUP.md.

## Security model

Read this before deploying:

- `firebase.projectId` and `firebase.apiKey` in `config.js` are **not secrets**.
  They identify the project and are visible in any deployed Firebase web app.
  Keeping them out of git is hygiene, not protection.
- **`firestore.rules` is what protects the data.** It allows the public to
  *create* an entry and forbids read, update and delete. Entrants' names, emails
  and phone numbers cannot be pulled from the web. **Never switch Firestore to
  test mode** (`allow read, write: if true`) — that would publish your entire
  entrant list to anyone who asks.
- `serviceAccount.json` (used by `draw.js`) **is** a real secret — full admin
  access. It's gitignored. Revoke it in Firebase console if it ever leaks.
- Rules also validate types, field lengths, email shape and consent values, and
  reject entries not marked 18+ — so eligibility is enforced at write time, not
  just in the UI.

## Files

| File | In git? | What it is |
|---|---|---|
| `index.html` | ✅ | The entire landing page + 3-step form. The deliverable. |
| `firestore.rules` | ✅ | Security rules. Paste into Firebase. **Don't skip.** |
| `config.example.js` | ✅ | Template for `config.js`. |
| `config.js` | 🔒 ignored | Your handle + Firebase `projectId`/`apiKey`. |
| `serviceAccount.json` | 🔒 ignored | Firebase admin key. **Real secret.** You create this. |
| `draw.js` | ✅ | List entries, export CSV, draw the winner. |
| `generate-qr.js` | ✅ | Booth QR code + printable branded sign. |
| `SETUP.md` | ✅ | Full setup, booth-day operating notes, legal reasoning. |

## Commands

```bash
npm install
npm run entries    # list all entries + totals
npm run draw       # 🏆 pick a random eligible winner
npm run csv        # export entries.csv
node generate-qr.js https://your-live-url.com
```
