/**
 * APAC Release Calendar — live web app
 * Reads the HK and SG tabs of a spreadsheet every time the page loads, so the
 * dashboard always reflects the current sheet. By default it reads the sheet this
 * script is bound to; set SHEET_ID below to point it at a different spreadsheet.
 *
 * Scope rules (match the dashboard):
 *   - Only tabs that have an "HK POC" or "SG POC" column are used
 *     (this automatically skips India / Switzerland / UAE tabs).
 *   - HK: all rows (all HK products are EQD).
 *   - SG: only rows whose "Asset Class" contains "EQD".
 *   - Rows with no client or no Live Target date are ignored.
 */

// ─── CONFIG: which spreadsheet to read ──────────────────────────────────────
// Leave BLANK ('') to read the sheet this script is bound to
//   (i.e. the sheet you opened via Extensions → Apps Script).
// To read a DIFFERENT sheet, paste its ID between the quotes. The ID is the long
// string in the sheet URL, between /d/ and /edit:
//   https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
// The other sheet must use the same column headers, and the account running this
// web app (Execute as: Me) must have at least view access to it.
var SHEET_ID = '';
// ────────────────────────────────────────────────────────────────────────────

// ─── CONFIG: which regional tabs to include ─────────────────────────────────
// Each entry is the prefix of that tab's "POC" column: the HK tab has an
// "HK POC" column, the SG tab has "SG POC", and so on. To pull in a NEW region
// — e.g. a Malaysia tab that has a "MY POC" column — just add 'MY' to this list:
//     var REGIONS = ['HK', 'SG', 'MY'];
// Tabs whose POC prefix is not listed here are ignored (so India 'BOM',
// Switzerland 'CH' and UAE 'AE' stay out unless you add them).
var REGIONS = ['HK', 'SG'];
// ────────────────────────────────────────────────────────────────────────────

function getSpreadsheet_() {
  return SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function doGet() {
  var data = getReleaseData();
  var t = HtmlService.createTemplateFromFile('Index');
  t.data = JSON.stringify(data);
  return t.evaluate()
    .setTitle('APAC Release Calendar')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function fmtCell(v) {
  if (v instanceof Date) {
    return v.getDate() + '-' + MONTHS[v.getMonth()] + '-' + String(v.getFullYear()).slice(-2);
  }
  return String(v == null ? '' : v).trim();
}

function getReleaseData() {
  var ss = getSpreadsheet_();
  var rows = [];

  ss.getSheets().forEach(function (sheet) {
    var values = sheet.getDataRange().getValues();
    if (!values.length) return;

    // Find the header row: the first row (within the top 10) containing Client + Env.
    var hr = -1, headers = null;
    for (var i = 0; i < Math.min(values.length, 10); i++) {
      var r = values[i].map(function (c) { return String(c).trim(); });
      if (r.indexOf('Client') > -1 && r.indexOf('Env') > -1) { hr = i; headers = r; break; }
    }
    if (hr < 0) return;

    // Map column name -> index (first occurrence wins).
    var idx = {};
    headers.forEach(function (h, i) { if (idx[h] === undefined) idx[h] = i; });

    // Region = the prefix of the "<X> POC" column, for X listed in REGIONS above.
    // Add a region to REGIONS and its tab is picked up automatically.
    var region = null;
    for (var ci = 0; ci < REGIONS.length; ci++) {
      if (idx[REGIONS[ci] + ' POC'] !== undefined) { region = REGIONS[ci]; break; }
    }
    if (!region) return;

    var cClient = idx['Client'], cEnv = idx['Env'], cProj = idx['Project'],
        cUat = idx['UAT Target'], cLive = idx['Live Target'],
        cAsset = idx['Asset Class'], cPoc = idx[region + ' POC'], cPune = idx['Pune POC'];

    for (var rr = hr + 1; rr < values.length; rr++) {
      var row = values[rr];
      var client = String(row[cClient] == null ? '' : row[cClient]).trim();
      if (!client) continue;

      var asset = cAsset !== undefined ? String(row[cAsset] == null ? '' : row[cAsset]).trim() : '';
      // Tabs that HAVE an "Asset Class" column are scoped to EQD; tabs without one
      // (e.g. HK, which is all EQD) keep every row. So a new region works either way.
      if (cAsset !== undefined && asset.toUpperCase().indexOf('EQD') < 0) continue;

      var live = fmtCell(cLive !== undefined ? row[cLive] : '');
      if (!live) continue; // must have a go-live date to sit on the calendar

      rows.push([
        region,
        client,
        String(row[cEnv] == null ? '' : row[cEnv]).trim(),
        cAsset !== undefined ? asset : 'EQD',
        String(row[cProj] == null ? '' : row[cProj]).trim(),
        fmtCell(cUat !== undefined ? row[cUat] : ''),
        live,
        cPoc  !== undefined ? String(row[cPoc]  == null ? '' : row[cPoc]).trim()  : '',
        cPune !== undefined ? String(row[cPune] == null ? '' : row[cPune]).trim() : ''
      ]);
    }
  });

  return rows;
}
