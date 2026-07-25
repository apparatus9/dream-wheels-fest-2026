/**
 * Dream Wheels — entries dashboard
 *
 * Reads every entry from Firestore and writes a clean, readable dashboard.html
 * (names, cars, what they're interested in, hot leads) that you open in a
 * browser. No spreadsheet or console digging.
 *
 *   node dashboard.js            build + print where it saved
 *   node dashboard.js --open     also open it in your browser
 *
 * Needs serviceAccount.json in this folder (already set up).
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const KEY = path.join(__dirname, 'serviceAccount.json');
if (!fs.existsSync(KEY)) {
  console.error('\n  serviceAccount.json not found — see SETUP.md.\n');
  process.exit(1);
}

const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require(KEY)) });
const db = admin.firestore();
const COLLECTION = process.env.DWF_COLLECTION || 'entries';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const INTENT_RANK = {
  'Actively looking now': 3,
  'Want a trade-in value': 3,
  'Maybe within a year': 2,
  'Just here for the cars': 1
};

(async () => {
  const snap = await db.collection(COLLECTION).orderBy('timestamp').get();
  const rows = snap.docs.map(d => d.data());

  // de-dupe by email (one person), keep the entry with the most tickets
  const byEmail = new Map();
  for (const r of rows) {
    const k = (r.email || '').trim().toLowerCase() || Math.random();
    const prev = byEmail.get(k);
    if (!prev || (r.tickets === '2') > (prev.tickets === '2')) byEmail.set(k, r);
  }
  const people = Array.from(byEmail.values());

  const hot = people.filter(r => INTENT_RANK[r.intent] === 3);
  const followers = people.filter(r => r.followed === 'Yes').length;
  const emailOk = people.filter(r => r.consent === 'Yes').length;
  const smsOk = people.filter(r => r.sms === 'Yes' && r.phone).length;

  const intentCounts = {};
  people.forEach(r => { intentCounts[r.intent || '—'] = (intentCounts[r.intent || '—'] || 0) + 1; });

  const fmtTime = t => {
    try { return new Date(t).toLocaleString('en-CA', { timeZone: 'America/Toronto', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return ''; }
  };

  // sort hottest leads first, then newest
  const sorted = people.slice().sort((a, b) =>
    (INTENT_RANK[b.intent] || 0) - (INTENT_RANK[a.intent] || 0) ||
    String(b.timestamp).localeCompare(String(a.timestamp)));

  const tr = people.length ? sorted.map(r => {
    const rank = INTENT_RANK[r.intent] || 0;
    const badge = rank === 3 ? '<span class="pill hot">🔥 Lead</span>'
      : rank === 2 ? '<span class="pill warm">Maybe</span>' : '';
    return `<tr class="${rank === 3 ? 'islead' : ''}">
      <td><b>${esc(r.first)} ${esc(r.last)}</b></td>
      <td>${esc(r.car)}</td>
      <td>${esc(r.intent)} ${badge}</td>
      <td class="dim">${esc(r.email)}</td>
      <td class="dim">${esc(r.phone) || '—'}</td>
      <td class="ctr">${r.followed === 'Yes' ? '✓' : ''}</td>
      <td class="ctr">${r.tickets === '2' ? '2' : '1'}</td>
      <td class="dim ctr">${fmtTime(r.timestamp)}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="8" class="empty">No entries yet — they’ll appear here as people submit.</td></tr>';

  const intentRows = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<div class="ib"><span>${esc(k)}</span><b>${v}</b></div>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dream Wheels — Entries</title>
<style>
  :root{--lime:#93b00b;--lime-br:#aecb1a;--ink:#0c0d09;--card:#15170f}
  *{box-sizing:border-box}
  body{margin:0;background:var(--ink);color:#f4f6ee;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  .wrap{max-width:1100px;margin:0 auto;padding:22px 16px 60px}
  h1{font-size:22px;margin:0 0 2px}
  .sub{color:#9aa08c;font-size:13px;margin:0 0 20px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 22px}
  .stat{background:var(--card);border:1px solid rgba(174,203,26,.2);border-radius:14px;padding:14px 16px}
  .stat .n{font-size:30px;font-weight:800;color:var(--lime-br);line-height:1}
  .stat .l{font-size:12px;color:#9aa08c;text-transform:uppercase;letter-spacing:.06em;margin-top:6px}
  .stat.hot .n{color:#ff8a5b}
  .panel{background:var(--card);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;margin-bottom:20px}
  .phead{padding:13px 16px;font-weight:700;font-size:14px;border-bottom:1px solid rgba(255,255,255,.07);letter-spacing:.04em;text-transform:uppercase;color:#dfe3d4}
  .ibs{display:flex;flex-wrap:wrap;gap:10px;padding:14px 16px}
  .ib{background:rgba(147,176,11,.1);border:1px solid rgba(174,203,26,.25);border-radius:999px;padding:8px 14px;font-size:14px;display:flex;gap:8px;align-items:center}
  .ib b{color:var(--lime-br)}
  .scroll{overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:14px;min-width:760px}
  th{text-align:left;padding:11px 12px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9aa08c;border-bottom:1px solid rgba(255,255,255,.1);position:sticky;top:0;background:var(--card)}
  td{padding:12px;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:top}
  tr.islead td{background:rgba(255,138,91,.06)}
  .dim{color:#aeb4a2}.ctr{text-align:center}
  .pill{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap}
  .pill.hot{background:#ff8a5b;color:#2a0f04}
  .pill.warm{background:rgba(174,203,26,.25);color:var(--lime-br)}
  .empty{text-align:center;color:#9aa08c;padding:40px}
  .foot{color:#6c7161;font-size:12px;margin-top:16px;text-align:center}
</style></head><body><div class="wrap">
  <h1>🏁 Dream Wheels — Entries</h1>
  <p class="sub">Generated ${fmtTime(Date.now())} · refresh by re-running <code>node dashboard.js</code></p>

  <div class="stats">
    <div class="stat"><div class="n">${people.length}</div><div class="l">People entered</div></div>
    <div class="stat hot"><div class="n">${hot.length}</div><div class="l">🔥 Sales leads</div></div>
    <div class="stat"><div class="n">${followers}</div><div class="l">IG followers</div></div>
    <div class="stat"><div class="n">${emailOk}</div><div class="l">OK to email</div></div>
    <div class="stat"><div class="n">${smsOk}</div><div class="l">OK to text</div></div>
  </div>

  ${people.length ? `<div class="panel"><div class="phead">What they're interested in</div><div class="ibs">${intentRows}</div></div>` : ''}

  <div class="panel">
    <div class="phead">Everyone (${people.length}) — hottest leads first</div>
    <div class="scroll"><table>
      <thead><tr><th>Name</th><th>Drives</th><th>Interested in</th><th>Email</th><th>Phone</th><th>Follows</th><th>Tickets</th><th>When</th></tr></thead>
      <tbody>${tr}</tbody>
    </table></div>
  </div>

  <p class="foot">Private — generated from your Firestore. Don't share this file; it has entrant contact info.</p>
</div></body></html>`;

  const out = path.join(__dirname, 'dashboard.html');
  fs.writeFileSync(out, html, 'utf8');
  console.log(`\n  ✓ dashboard.html written — ${people.length} people (${hot.length} hot leads)\n  ${out}\n`);

  if (process.argv.includes('--open')) {
    const cmd = process.platform === 'win32' ? `start "" "${out}"` : process.platform === 'darwin' ? `open "${out}"` : `xdg-open "${out}"`;
    exec(cmd);
  }
  process.exit(0);
})().catch(e => { console.error('\n  ✗ ' + e.message + '\n'); process.exit(1); });
