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

  // One entry per person: if the same email appears more than once, keep only
  // the best (most tickets, then earliest). This is where duplicates are
  // removed — the form lets every submission through.
  const byEmail = new Map();
  let dupes = 0;
  for (const r of rows) {
    const key = (r.email || '').trim().toLowerCase();
    if (!key) { byEmail.set('__blank__' + byEmail.size, r); continue; }
    const prev = byEmail.get(key);
    if (!prev) { byEmail.set(key, r); }
    else {
      dupes++;
      const better = (r.tickets === '2' ? 2 : 1) > (prev.tickets === '2' ? 2 : 1);
      if (better) byEmail.set(key, r);
    }
  }
  const unique = Array.from(byEmail.values());

  // Eligibility is 18+ only. Following is no longer required to enter — it just
  // earns a 2nd ticket, so followers get double the odds in the draw.
  const eligible = unique.filter(r => r.age18 === 'Yes');
  const ticketsFor = r => (r.tickets === '2' ? 2 : 1);   // trust but clamp
  const totalTickets = eligible.reduce((n, r) => n + ticketsFor(r), 0);

  if (args.includes('--draw')) {
    if (!eligible.length) {
      console.log('\n  No eligible entries (need 18+).\n');
      process.exit(0);
    }
    // Weighted draw: build a pool where a 2-ticket entry appears twice, so a
    // follower is exactly twice as likely to win as a non-follower.
    let hit = Math.floor(Math.random() * totalTickets);
    let w = eligible[0];
    for (const r of eligible) {
      hit -= ticketsFor(r);
      if (hit < 0) { w = r; break; }
    }
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   🏆  WINNER — FREE OIL FOR LIFE                 ║
  ╚══════════════════════════════════════════════════╝

     Name        ${w.first} ${w.last}
     Ticket      ${w.ticket}
     Tickets     ${ticketsFor(w)} ${w.followed === 'Yes' ? '(followed — bonus)' : ''}
     Email       ${w.email}
     Phone       ${w.phone || '—'}
     Drives      ${w.car}

     Drawn from ${eligible.length} eligible entrants holding
     ${totalTickets} tickets in total.
`);
    process.exit(0);
  }

  if (args.includes('--csv')) {
    const cols = ['ticket', 'timestamp', 'first', 'last', 'email', 'phone',
                  'car', 'intent', 'followed', 'tickets', 'age18', 'consent', 'sms'];
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
  console.log('  ' + pad('TICKET', 12) + pad('NAME', 24) + pad('EMAIL', 28) + 'DRIVES');
  console.log('  ' + '─'.repeat(92));
  for (const r of rows) {
    console.log('  ' + pad(r.ticket, 12) + pad(`${r.first} ${r.last}`, 24) +
                pad(r.email, 28) + String(r.car || ''));
  }

  const consented = unique.filter(r => r.consent === 'Yes').length;
  const textable  = unique.filter(r => r.sms === 'Yes' && r.phone).length;
  const followers = unique.filter(r => r.followed === 'Yes').length;

  // purchase intent — the reason this list is worth more than a raffle list
  const byIntent = {};
  for (const r of rows) byIntent[r.intent || '—'] = 1 + (byIntent[r.intent || '—'] || 0);
  const hot = rows.filter(r => r.intent === 'Actively looking now' ||
                               r.intent === 'Want a trade-in value').length;

  console.log(`
  ─────────────────────────────────────────
  Total submissions    ${rows.length}${dupes ? '   (' + dupes + ' duplicate email' + (dupes > 1 ? 's' : '') + ' merged)' : ''}
  Unique people        ${unique.length}
  Eligible for draw    ${eligible.length}   (18+)
  Instagram followers  ${followers}   (took the bonus 2nd ticket)
  Tickets in the draw  ${totalTickets}   (followers count twice)
  Email consent given  ${consented}   (safe to email under CASL)
  Text consent given   ${textable}   (opted in AND gave a phone number)

  PURCHASE INTENT`);
  for (const [k, v] of Object.entries(byIntent).sort((a, b) => b[1] - a[1])) {
    console.log('    ' + pad(k, 30) + v);
  }
  console.log(`
  🔥 ${hot} sales lead${hot === 1 ? '' : 's'} — actively looking or want a trade-in value

  node draw.js --draw   pick the winner
  node draw.js --csv    export to entries.csv
`);
  process.exit(0);
})().catch(err => {
  console.error('\n  ✗ ' + err.message + '\n');
  process.exit(1);
});
