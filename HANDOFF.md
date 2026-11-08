# APAC Release Calendar — Chat Handoff

> Purpose of this file: let a **fresh Claude chat (new account)** pick up this project with zero prior context. Everything needed is here or in this repo.
> Last updated: 8 Nov 2026.

---

## 1. The goal

Build an **APAC (Hong Kong + Singapore) UAT/Production release calendar** for the user's employer (**FinIQ**, a structured-products platform vendor) to show to **higher management / CEO**.

Requirements that emerged over the chat:
- Consolidate two tabs (**HK**, **SG**) of a Google Sheet into **one** at-a-glance, visually polished dashboard.
- **EQD scope** only (equity derivatives).
- **Grouped by environment**; coloured by market.
- **Live** — reflects the sheet whenever it changes, no manual copying.
- **Shareable org-wide, on mobile, from anywhere, no login** — and **not** a `claude.ai` URL (management-facing).
- **Version-controlled** so it can be edited from any machine.
- **Configurable** — able to point at a different sheet, and to pick up **new region tabs** (e.g. Malaysia, Japan) with minimal edits.

---

## 2. Key facts

- **User GitHub:** `manov2102`. **Email:** manovisbad@gmail.com.
- **Source Google Sheet ID:** `1I4BGfnYBctnVJEGcP7w5FGMMXs71xaiJTxwcwhFNJw4`
  (`https://docs.google.com/spreadsheets/d/1I4BGfnYBctnVJEGcP7w5FGMMXs71xaiJTxwcwhFNJw4/edit`)
- The sheet has **5 tabs**: HK (61 rows), SG (38 rows), India/BOM (2), Switzerland/EuroC (12), UAE/Mashreq (5). **Only HK + SG are in scope.**
- **HK tab columns:** `#, Client, Env, Project, Target as-of, Target updater, UAT Target, Live Target, HK POC, Pune POC, 5Star as-of`
- **SG tab columns:** `#, Client, Env, Asset Class, Project, Updated As-Of, Updated By, UAT Target, Live Target, SG POC, Pune POC, 5Star as-of`
  (SG has an extra **Asset Class** column; HK does not.)
- **EQD-scoped dataset:** 61 HK + 17 SG = **78 releases**, window **Aug 2026 – Jan 2027**.
- Region of a tab is identified by its **`<X> POC`** column (`HK POC`, `SG POC`, …). That's the hook used to include/skip tabs.

### The deliverable right now
- **GitHub repo (source of truth):** `https://github.com/manov2102/apac-release-calendar` — **private**, branch `main`. Contains `Code.gs`, `Index.html`, `README.md`, `.gitignore`, and this `HANDOFF.md`.
- **Local clone:** `C:\Users\manov\OneDrive\Documents\Claude\apac-release-calendar`
- **Live app:** a **Google Apps Script Web App** deployed from the user's Google account, bound to the sheet, served at a `script.google.com/.../exec` URL. **This `/exec` URL is what gets shared with management.**
- **claude.ai preview (NOT for management, just to eyeball):** https://claude.ai/code/artifact/d7467e3d-f595-487b-90ad-3ee4d36de588
- **Desktop paste-helpers** (plain-text copies for pasting into the Apps Script editor, since `.html` opens as a rendered page): `APAC_Code_gs.txt`, `APAC_Index_html.txt` on the user's Desktop.

---

## 3. How the live app works (architecture)

Two files, deployed inside the sheet via **Extensions → Apps Script**:

1. **`Code.gs`** (server) — on each page load, reads the HK/SG tabs of the bound sheet, applies scope rules, and serves `Index.html` with the data injected. Deployed as a **Web app**, **Execute as: Me**, **Who has access: Anyone** (so any viewer, on any device, with no Google login and no access to the sheet, can see it). `setXFrameOptionsMode(ALLOWALL)` is set (was needed for Google Sites embedding; harmless now).
2. **`Index.html`** (UI) — the dashboard (HTML + CSS + vanilla JS, IBM Plex fonts). Data arrives via an Apps Script template tag: `const RAW = <?!= data ?>;`. **No client/staff data is stored in the repo** — it all lives in the sheet.

**Updating data:** just edit the sheet; the app re-reads on reload / the in-page **Refresh** button.
**Updating code/design:** paste changed file(s) into Apps Script → **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The `/exec` URL stays the same.

The repo is the portable source; GitHub and Apps Script are **not auto-synced** (would need `clasp` + a GitHub Action — offered, not done).

---

## 4. Decisions made (and why)

1. **Visual web dashboard, not a Sheet tab** — user wanted "pleasing, understandable at one sight" for a CEO.
2. **Scope = HK + SG only; SG filtered to EQD** (HK is all EQD). India/CH/UAE excluded. *User choice.*
3. **Group by the raw Env value** (CMN4 is one group, `All` is its own group, etc.) — not by buy/sell. *Explicit user instruction.*
4. **Env colour families (4):** Shared/CMN (indigo), Dedicated client env (slate), Diamond (violet), Cross-platform `All` (amber). Drives the Environment filter chips + colour coding. Rule: `^CMN`→shared, `All`→cross, contains `Diamond`→diamond, else dedicated.
5. **Design:** IBM Plex Serif (masthead) / Sans (UI) / Mono (dates & numbers); region colours HK = red, SG = teal; theme-aware (light/dark); mobile-responsive. Enterprise "briefing" style.
6. **Hosting = Apps Script Web App served at `/exec` directly.** A Google Site wrapper was tried (the user's org blocks Google Sites, so a personal account was used at `sites.google.com/view/apac-release-calendar/home`) but it **boxed the dashboard into a small scroll area and looked bad on desktop and mobile** → **decision: abandon the Site, share the `/exec` URL as a named hyperlink** (full-page, responsive, Google domain — the only thing the user wanted to avoid was a `claude.ai` URL).
7. **New private GitHub repo** `manov2102/apac-release-calendar` (explicitly **not** committed into the unrelated `structured-products-learning` repo). `gh` CLI is **not installed**; repo was created by the user in the browser, then pushed with cached git credentials.
8. **`Code.gs` made configurable:**
   - `SHEET_ID` constant — blank = bound sheet; set to an ID = read any other sheet (same columns) via `openById`.
   - `REGIONS` whitelist — `['HK','SG']`; add `'MY'` etc. to include a new tab (matched by its `MY POC` column).
   - EQD rule generalised: tabs **with** an `Asset Class` column are filtered to EQD; tabs **without** keep all rows.
9. **`Index.html` made region-agnostic:** regions are discovered from the data; colours come from `--r0..--r5` CSS slots; KPI tiles, Market filter, chart segments, row colours, legend, and footer all render per region. Config at top of the script: `REGION_ORDER`, `REGION_NAMES`, `REGION_SLOTS`. HK keeps r0 (red), SG r1 (teal), so the existing look is unchanged. Verified by injecting a fake `MY` row — it produced a Malaysia tile, an `MY` filter button, a "Malaysia desk" legend line, and a 3-colour chart. Masthead renamed to **"APAC Release Calendar"**.
10. **Chart label fix:** each month's count sits **directly on top of its own bar** (bars are % of available height, capped at 80%, so the tallest number never overflows the card). Replaced an earlier fixed-130px-bar bug.
11. **KPI boxes = Buy-side / Sell-side (IB), as DISTINCT CLIENTS.** Replaced the old "Distinct clients" box.
    - **Classification rule:** env is `All` **or** client name ends in `IB` → **Sell-side (IB)** (investment banks running platform-wide migrations); everything else → **Buy-side**.
    - They count **distinct clients**, not releases: **Buy-side 32 + Sell-side 9 = 41** (= old distinct-clients total). HK/SG boxes still count **releases** (61 + 17 = 78). Labels say "clients" vs region names to keep the two units clear.
    - The user **rejected** a buy/sell filter/group control — only the two KPI boxes were wanted.

---

## 5. Final code

- **`Code.gs`** — full current version is reproduced in [§7 below](#7-final-codegs-full) and lives in this repo.
- **`Index.html`** — ~700 lines; the canonical copy is **in this repo** (`Index.html`). Key things to know rather than re-reading all of it:
  - Data shape per row (array): `[region, client, env, asset, project, uat, live, poc, pune]`. `Code.gs` emits exactly this; the artifact/source hardcodes the same shape in a `RAW=[…]` array for preview.
  - **Region config** near the top of the `<script>`: `REGION_ORDER`, `REGION_NAMES` (code→label, incl. MY/JP/TH/KR/…), `REGION_SLOTS=6`. `computeRegions()` assigns each present region a colour slot in order; `regColor(r)` → `var(--rN)`.
  - **Buy/Sell:** `sideOf(env, client)` → `'sell'` if env==`All` or name ends `IB`, else `'buy'`; set as `d.side` in `buildData`.
  - **Env categories:** `envCat()` + `CATNAME`/`CATDESC`/`CATORDER`.
  - Render pipeline: `renderAll()` → `computeRegions, renderRegSeg, renderKPIs, renderChart, renderList, renderCatFilters, renderLegend, renderFooter`.
  - Theme toggle + a **Refresh** button that only appears under Apps Script (`google.script.run.getReleaseData`).
- **The source/preview file** (hardcoded HK+SG data, used to generate `Index.html` and publish the claude.ai artifact) lives in the session scratchpad as `apac-release-calendar.html`. `Index.html` is produced from it by a small Node script that: replaces the `RAW=[…]` literal with `const RAW = <?!= data ?>;`, swaps the fixed `TODAY` for `new Date()`, changes "vs 25 Aug 2026" → "vs today", swaps the masthead "Pipeline as of / 11 Aug 2026" block for a live "loaded" date, and wraps it in `<!DOCTYPE html>…`. (If continuing, you can just edit `Index.html` in the repo directly and keep the `<?!= data ?>` tag.)

---

## 6. Open questions / next steps

**Immediate next step (user action):** **redeploy** the Apps Script so the live `/exec` reflects the latest repo files. Paste `Code.gs` **and** `Index.html` into the Apps Script editor (from the Desktop `.txt` copies or the repo), Save → **Deploy → Manage deployments → ✏️ → New version → Deploy**. The current live deployment may still be an older version.

**To share with management:** send the **`/exec` URL** as a named hyperlink (full-page, mobile-friendly, `script.google.com`). The Google Site is abandoned.

**Buy/Sell edge case to confirm with the user:** classification keys off env `All`. If a sell-side/IB client ever sits on a **non-`All`** env and its name doesn't end in `IB`, it'd be miscounted as buy-side. No such case in today's data (the 9 sell-side are all env `All`: BNP IB, HSBC IB, CACIB, Citi, Nomura IB, Barclays IB, BAML, Socgen, BOCI IB). If any client must be forced one way, extend `sideOf()`.

**Adding a region later (e.g. Malaysia):** (1) add the MY tab with a `MY POC` column and same headers; (2) in `Code.gs` set `var REGIONS = ['HK','SG','MY'];`; (3) `MY` is already in `Index.html`'s `REGION_ORDER`/`REGION_NAMES`; (4) redeploy (new version). The UI then auto-adds the tile/filter/colour/legend. EQD rule auto-applies (MY filtered to EQD iff its tab has an `Asset Class` column).

**Offered but NOT built (pick up if the user asks):**
- "Last sheet update" line pulled from the sheet's `Target as-of` cell (vs just page-load time).
- Google Analytics for view counts.
- `clasp` + GitHub Action to auto-deploy GitHub → Apps Script (removes the copy-paste step).
- Splitting combined client labels like `BOS / OCBC` into BOS + OCBC for the distinct count (currently naive; happens to still equal 41 here because standalone BOS isn't in the EQD data).

**Verification gap:** the final build was validated by executing the real `Index.html` script in Node (HK/SG unchanged; MY flows through correctly) but **not** screenshotted in a browser this session (the in-app browser pane was hidden behind the user's Chrome). Eyeball the preview/`/exec` once.

**Known data quirk:** one row has UAT target **after** Live target (Causeway Sec, HK) — the UI flags such rows with a ⚠. Dates are targets, not confirmations.

---

## 7. Final `Code.gs` (full)

```javascript
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
// Leave BLANK ('') to read the sheet this script is bound to.
// To read a DIFFERENT sheet, paste its ID (the string between /d/ and /edit).
// Same column headers required; the account running the web app (Execute as: Me)
// needs at least view access to it.
var SHEET_ID = '';
// ────────────────────────────────────────────────────────────────────────────

// ─── CONFIG: which regional tabs to include ─────────────────────────────────
// Each entry is the prefix of that tab's "POC" column (HK POC, SG POC, ...).
// Add 'MY' to pull in a Malaysia tab, etc. Unlisted tabs are ignored.
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

    // Find the header row: first row (top 10) containing Client + Env.
    var hr = -1, headers = null;
    for (var i = 0; i < Math.min(values.length, 10); i++) {
      var r = values[i].map(function (c) { return String(c).trim(); });
      if (r.indexOf('Client') > -1 && r.indexOf('Env') > -1) { hr = i; headers = r; break; }
    }
    if (hr < 0) return;

    var idx = {};
    headers.forEach(function (h, i) { if (idx[h] === undefined) idx[h] = i; });

    // Region = prefix of the "<X> POC" column, for X in REGIONS.
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
      // Tabs WITH an "Asset Class" column are scoped to EQD; tabs without keep all rows.
      if (cAsset !== undefined && asset.toUpperCase().indexOf('EQD') < 0) continue;

      var live = fmtCell(cLive !== undefined ? row[cLive] : '');
      if (!live) continue;

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
```

---

## 8. Deploy checklist (copy for the new chat)

1. Sheet → **Extensions → Apps Script**.
2. `Code.gs` ← paste repo `Code.gs`. Add an HTML file named exactly **`Index`** ← paste repo `Index.html`. **Save.**
3. **Deploy → New deployment → Web app** → Execute as **Me**, Who has access **Anyone** → Deploy → authorise (click through the "unverified app" warning — it's the user's own script).
4. Copy the **`/exec`** URL → that's the share link.
5. Later changes: paste file(s) → **Manage deployments → ✏️ → New version → Deploy** (same URL).
