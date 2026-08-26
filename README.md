# APAC Release Calendar

A live, self-updating web dashboard of the **Hong Kong & Singapore (EQD)** UAT / production
release pipeline. It reads the **HK** and **SG** tabs of the release-tracker Google Sheet every
time the page loads, so the calendar always reflects the current sheet — no manual data copying.

The dashboard consolidates both desks onto one timeline, groups releases by environment
(CMN shared platform, dedicated client envs, Diamond, cross-platform "All"), colours them by
market, and shows a month-by-month go-live load chart with market / environment / timing filters.

> **No data lives in this repo.** The client names, POCs and dates all stay in the Google Sheet.
> `Index.html` only contains a `<?!= data ?>` placeholder that Apps Script fills in at runtime.

---

## Files

| File | Role |
|------|------|
| `Code.gs` | Server side. Runs in Google Apps Script, reads the HK & SG tabs of the bound spreadsheet, applies the scope rules, and serves `Index.html`. |
| `Index.html` | The dashboard UI (HTML + CSS + vanilla JS). Data is injected into it by `Code.gs`. |

### Scope rules (enforced in `Code.gs`)
- Only tabs with an **`HK POC`** or **`SG POC`** column are used (India / Switzerland / UAE tabs are ignored automatically).
- **HK:** all rows (all HK products are EQD).
- **SG:** only rows whose **`Asset Class`** contains `EQD`.
- Rows with no client, or no `Live Target` date, are skipped.

Column headers it expects: `Client, Env, Project, UAT Target, Live Target, Asset Class,
HK POC / SG POC, Pune POC`.

---

## Deploy / update the live app

1. Open the release-tracker Google Sheet → **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with this repo's `Code.gs`.
3. Add an HTML file named exactly **`Index`** and paste this repo's `Index.html` into it.
4. **Save.**
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the **Web app URL** (ends in `/exec`) — that's the shareable link.

**To update later:** edit the file(s), paste back into Apps Script, then
**Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The `/exec` URL stays the same.

**To change the data:** just edit the Google Sheet. The app re-reads it on every load / Refresh —
no redeploy needed.

---

## Adding a new region (e.g. Malaysia)

The app is region-agnostic — HK and SG aren't special-cased. To add a Malaysia desk:

1. Add the **MY tab** to the sheet with the same headers, including an **`MY POC`** column.
2. In `Code.gs`, add its code to the whitelist:
   ```javascript
   var REGIONS = ['HK', 'SG', 'MY'];
   ```
3. (Optional, for a nicer label/order/colour in the UI) in `Index.html`, `MY` is already in
   `REGION_ORDER` and `REGION_NAMES` (→ "Malaysia"). Add any brand-new code there too.
   Colours come from the `--r0..--r5` CSS variables and are assigned to regions in order.
4. **Save → Deploy → Manage deployments → New version.**

The new region then appears automatically as its own KPI tile, Market-filter button, chart
segment colour, row colour, and legend entry. The EQD scope rule also applies automatically:
tabs that have an `Asset Class` column are filtered to EQD, tabs without one keep every row.

## Editing from anywhere

This repo is the portable source of truth for the app code. From any device you can edit `Code.gs`
or `Index.html` here on GitHub (or clone the repo), then paste the changed file into Apps Script and
redeploy (steps above) to push the change live.
