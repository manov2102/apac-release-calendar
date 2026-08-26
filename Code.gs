/**
 * APAC Release Calendar — live web app
 * Reads the HK and SG tabs of THIS spreadsheet every time the page loads,
 * so the dashboard always reflects the current sheet.
 *
 * Scope rules (match the dashboard):
 *   - Only tabs that have an "HK POC" or "SG POC" column are used
 *     (this automatically skips India / Switzerland / UAE tabs).
 *   - HK: all rows (all HK products are EQD).
 *   - SG: only rows whose "Asset Class" contains "EQD".
 *   - Rows with no client or no Live Target date are ignored.
 */

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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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

    // Region is decided by which POC column the tab has. Only HK & SG are kept.
    var region = idx['HK POC'] !== undefined ? 'HK'
               : idx['SG POC'] !== undefined ? 'SG' : null;
    if (!region) return;

    var cClient = idx['Client'], cEnv = idx['Env'], cProj = idx['Project'],
        cUat = idx['UAT Target'], cLive = idx['Live Target'],
        cAsset = idx['Asset Class'], cPoc = idx[region + ' POC'], cPune = idx['Pune POC'];

    for (var rr = hr + 1; rr < values.length; rr++) {
      var row = values[rr];
      var client = String(row[cClient] == null ? '' : row[cClient]).trim();
      if (!client) continue;

      var asset = cAsset !== undefined ? String(row[cAsset] == null ? '' : row[cAsset]).trim() : '';
      if (region === 'SG' && asset.toUpperCase().indexOf('EQD') < 0) continue; // EQD scope

      var live = fmtCell(cLive !== undefined ? row[cLive] : '');
      if (!live) continue; // must have a go-live date to sit on the calendar

      rows.push([
        region,
        client,
        String(row[cEnv] == null ? '' : row[cEnv]).trim(),
        region === 'HK' ? 'EQD' : asset,
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
