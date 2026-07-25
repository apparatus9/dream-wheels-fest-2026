/**
 * Booth QR code generator — Dream Wheels on Eglinton Fest 2026
 *
 *   npm install qrcode
 *   node generate-qr.js https://your-live-url.com
 *
 * Outputs:
 *   qr.svg   -> use this for anything printed (vector, scales to any size)
 *   qr.png   -> 1400px, for screens / quick prints
 *   qr.html  -> a ready-to-print booth sign, branded. Open it and hit Ctrl+P.
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const url = process.argv[2];

if (!url || !/^https?:\/\//i.test(url)) {
  console.error('\n  Usage: node generate-qr.js https://your-live-url.com');
  console.error('  (the protocol matters — a bare domain opens as a web search in some scanners)\n');
  process.exit(1);
}

// errorCorrectionLevel H = ~30% recoverable: survives print smudges and a
// wet/creased booth sign. Worth the extra density.
const opts = {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 1400,
  color: { dark: '#000000', light: '#FFFFFF' } // dark-on-light: inverted codes break many scanners
};

// Inline the dealer logo so qr.html is a single self-contained printable file.
function logoDataUri() {
  const p = path.join(__dirname, 'assets', 'golden-mile-chrysler.png');
  if (!fs.existsSync(p)) return null;
  return 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
}

(async () => {
  await QRCode.toFile('qr.png', url, opts);
  await QRCode.toFile('qr.svg', url, { ...opts, type: 'svg' });
  const dataUrl = await QRCode.toDataURL(url, opts);

  const logo = logoDataUri();
  const logoTag = logo ? `<img class="logo" src="${logo}" alt="Golden Mile Chrysler">` : '';

  fs.writeFileSync('qr.html', `<!doctype html>
<meta charset="utf-8">
<title>Dream Wheels — Booth QR</title>
<style>
  @page { size: letter portrait; margin: 12mm }
  body{margin:0;background:#050505;color:#f4f6ee;font-family:'Arial Narrow',system-ui,sans-serif;
       text-align:center;display:flex;flex-direction:column;justify-content:center;
       align-items:center;min-height:100vh;padding:28px}
  .eyebrow{font-size:22px;letter-spacing:.22em;text-transform:uppercase;color:#c6e23c;margin:0 0 6px;font-weight:700}
  h1{font-size:74px;line-height:.92;margin:0 0 4px;text-transform:uppercase;font-weight:900;letter-spacing:-.01em}
  h1 .hl{color:#aecb1a}
  .sub{font-size:26px;letter-spacing:.14em;text-transform:uppercase;margin:14px 0 26px;color:#dfe3d4;font-weight:700}
  .code{background:#fff;padding:22px;border-radius:18px;display:inline-block;box-shadow:0 0 70px rgba(198,226,60,.45)}
  .code img{width:400px;height:400px;display:block}
  .scan{font-size:30px;letter-spacing:.2em;text-transform:uppercase;margin:26px 0 6px;font-weight:900;color:#aecb1a}
  .url{font-family:system-ui,sans-serif;font-size:14px;color:#8d9480;word-break:break-all;max-width:520px;margin:8px auto 0}
  .foot{margin-top:22px;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:#c6e23c;font-weight:700}
  .logo{width:340px;max-width:70%;margin:0 auto 22px;display:block}
  @media print{body{background:#050505 !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
<body>
  ${logoTag}
  <p class="eyebrow">Thanks for visiting our booth</p>
  <h1>Win Free<br><span class="hl">Oil For Life</span></h1>
  <p class="sub">Dream Wheels on Eglinton Fest 2026</p>
  <div class="code"><img src="${dataUrl}" alt="Scan to enter the raffle"></div>
  <p class="scan">Scan to enter</p>
  <p class="url">${url}</p>
  <p class="foot">All proceeds in support of SickKids</p>
</body>`);

  console.log('\n  ✓ qr.svg   — print this one');
  console.log('  ✓ qr.png   — screens');
  console.log('  ✓ qr.html  — printable booth sign, open and Ctrl+P');
  console.log(`\n  Encodes: ${url}\n`);
  console.log('  Now VERIFY it scans with your actual phone camera before printing.\n');
})();
