/**
 * Dream Wheels on Eglinton Fest 2026 — raffle entry collector
 *
 * Paste this into Extensions > Apps Script on a new Google Sheet,
 * then Deploy > New deployment > Web app:
 *    Execute as:        Me
 *    Who has access:    Anyone
 * Copy the /exec URL it gives you into CONFIG.submitEndpoint in index.html.
 *
 * See SETUP.md for the click-by-click version.
 */

var HEADERS = [
  'Ticket', 'Timestamp (ET)', 'First', 'Last', 'Email', 'Phone',
  'Current car', 'Instagram', 'Followed', '18+', 'Email consent', 'Event'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // serialise writes so simultaneous booth scans can't collide

  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    sheet.appendRow([
      data.ticket || '',
      formatEastern_(data.timestamp),
      data.first || '',
      data.last || '',
      data.email || '',
      data.phone || '',
      data.car || '',
      data.instagram || '',
      data.followed || '',
      data.age18 || '',
      data.consent || '',
      data.event || ''
    ]);

    return json_({ ok: true, ticket: data.ticket });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, message: 'Dream Wheels entry collector is live.' });
}

/** Creates + formats the Entries tab on first run. */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Entries');

  if (!sheet) {
    sheet = ss.insertSheet('Entries');
    sheet.appendRow(HEADERS);
    var head = sheet.getRange(1, 1, 1, HEADERS.length);
    head.setFontWeight('bold')
        .setBackground('#93b00b')
        .setFontColor('#0a0c04');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(2, 165);
    sheet.setColumnWidth(5, 220);
    sheet.setColumnWidth(7, 200);
  }
  return sheet;
}

function formatEastern_(iso) {
  var d = iso ? new Date(iso) : new Date();
  return Utilities.formatDate(d, 'America/Toronto', 'yyyy-MM-dd HH:mm:ss');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ---- WINNER PICKER ----
 * Run this from the Apps Script editor (or add a Sheet button) when it's
 * time to draw. Picks one random eligible entry and pops it up.
 * Eligible = 18+ confirmed AND followed confirmed.
 */
function drawWinner() {
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) { SpreadsheetApp.getUi().alert('No entries yet.'); return; }

  var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var eligible = rows.filter(function (r) {
    return String(r[9]).toLowerCase() === 'yes' && String(r[8]).toLowerCase() === 'yes';
  });

  if (!eligible.length) { SpreadsheetApp.getUi().alert('No eligible entries.'); return; }

  var w = eligible[Math.floor(Math.random() * eligible.length)];
  SpreadsheetApp.getUi().alert(
    '🏆 WINNER — Free Oil For Life\n\n' +
    w[2] + ' ' + w[3] + '\n' +
    'Ticket:    ' + w[0] + '\n' +
    'Instagram: ' + w[7] + '\n' +
    'Email:     ' + w[4] + '\n' +
    'Phone:     ' + (w[5] || '—') + '\n' +
    'Drives:    ' + w[6] + '\n\n' +
    'Drawn from ' + eligible.length + ' eligible entries.'
  );
}

/** Adds a "Dream Wheels" menu to the Sheet with the draw button. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏁 Dream Wheels')
    .addItem('Draw a winner', 'drawWinner')
    .addToUi();
}
