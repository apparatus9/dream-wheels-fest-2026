/**
 * Dream Wheels on Eglinton Fest 2026 — entry list + winner draw
 *
 * Firestore rules block reading entries from the web (that's deliberate — it
 * keeps entrants' contact details private). So you read them here instead,
 * authenticated as the project owner with a service account key.
 *
 * ONE-TIME SETUP
 *   1. Firebase console > ⚙ Project settings > Service accounts
 *   2. "Generate new private key" > it downloads a .json file
 *   3. Rename it to serviceAccount.json and drop it in this folder
 *      (it's gitignored — this one IS a real secret, unlike the apiKey)
 *   4. npm install
 *
 * USAGE
 *   node draw.js            list every entry + a summary
 *   node draw.js --csv      write entries.csv
 *   node draw.js --draw     pick a random eligible winner 🏆
 */

const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, 'serviceAccount.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`
  ✗ serviceAccount.json not found.

    Firebase console > ⚙ Project settings > Service accounts
      > "Generate new private key", then save the downloaded file here as:

      ${KEY_PATH}
`);
  process.exit(1);
}

let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  console.error('\n  ✗ Dependencies not installed. Run:  npm install\n');
  process.exit(1);
}

const COLLECTION = process.env.DWF_COLLECTION || 'entries';

admin.initializeApp({ credential: admin.credential.cert(require(KEY_PATH)) });
const db = admin.firestore();

const pad = (s, n) => String(s == null ? '' : s).padEnd(n).slice(0, n);

(async () => {
  const snap = await db.collection(COLLECTION).orderBy('timestamp').get();
  const rows = snap.docs.map(d => d.data());

  if (!rows.length) {
    console.log(`\n  No entries in "${COLLECTION}" yet.\n`);
    process.exit(0);
  }

  const args = process.argv.slice(2);

  // Eligible = confirmed 18+ AND confirmed they followed on Instagram.
  const eligible = rows.filter(r => r.age18 === 'Yes' && r.followed === 'Yes');

  if (args.includes('--draw')) {
    if (!eligible.length) {
      console.log('\n  No eligible entries (need 18+ and follow confirmed).\n');
      process.exit(0);
    }
    const w = eligible[Math.floor(Math.random() * eligible.length)];
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   🏆  WINNER — FREE OIL FOR LIFE                 ║
  ╚══════════════════════════════════════════════════╝

     Name        ${w.first} ${w.last}
     Ticket      ${w.ticket}
     Instagram   ${w.instagram}
     Email       ${w.email}
     Phone       ${w.phone || '—'}
     Drives      ${w.car}

     Drawn at random from ${eligible.length} eligible entries
     (${rows.length} total entries).
`);
    process.exit(0);
  }

  if (args.includes('--csv')) {
    const cols = ['ticket', 'timestamp', 'first', 'last', 'email', 'phone',
                  'car', 'instagram', 'followed', 'age18', 'consent'];
    const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = [cols.join(',')]
      .concat(rows.map(r => cols.map(c => esc(r[c])).join(',')))
      .join('\r\n');
    fs.writeFileSync('entries.csv', '﻿' + csv, 'utf8'); // BOM so Excel reads accents
    console.log(`\n  ✓ entries.csv written — ${rows.length} entries\n`);
    process.exit(0);
  }

  // default: print the list
  console.log(`\n  ${rows.length} entries in "${COLLECTION}"\n`);
  console.log('  ' + pad('TICKET', 12) + pad('NAME', 24) + pad('INSTAGRAM', 22) + 'DRIVES');
  console.log('  ' + '─'.repeat(88));
  for (const r of rows) {
    console.log('  ' + pad(r.ticket, 12) + pad(`${r.first} ${r.last}`, 24) +
                pad(r.instagram, 22) + String(r.car || ''));
  }

  const consented = rows.filter(r => r.consent === 'Yes').length;
  console.log(`
  ─────────────────────────────────────────
  Total entries        ${rows.length}
  Eligible for draw    ${eligible.length}   (18+ and follow confirmed)
  Email consent given  ${consented}   (safe to email under CASL)

  node draw.js --draw   pick the winner
  node draw.js --csv    export to entries.csv
`);
  process.exit(0);
})().catch(err => {
  console.error('\n  ✗ ' + err.message + '\n');
  process.exit(1);
});
