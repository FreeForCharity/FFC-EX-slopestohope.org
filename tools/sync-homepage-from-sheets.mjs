import { readFileSync, writeFileSync } from 'node:fs';

const INVENTORY_ID = '15Gs3Qabfm1NTWxZu_J2aD3LtJaQ5vNkZkc41QCxRQWI';
const FUNDRAISING_ID = '1_Ac8DmVy7x0dkhhOdDJVVsziyqvDqm-jC9Ua82uRqfw';
const HISTORY_BASELINE = 20855.4;
const GOAL = 20000;

function check(ok, message) {
  if (!ok) throw new Error(message);
}
function roundPounds(n) {
  return Math.round(n).toLocaleString('en-US');
}
function reconciles(a, b) {
  // At most 1,000 fetched rows: allow floating-point accumulation only.
  // Even that allowance must never straddle either published rounding boundary.
  return Math.abs(a - b) <= Number.EPSILON * 2048 * Math.max(1, Math.abs(a), Math.abs(b)) &&
    Math.round(a) === Math.round(b) &&
    (100 * a / GOAL).toFixed(2) === (100 * b / GOAL).toFixed(2);
}
function replaceExactlyOnce(source, pattern, makeReplacement, label) {
  const matches = [...source.matchAll(pattern)];
  check(matches.length === 1, label + ': expected exactly one matching field, found ' + matches.length);
  return source.replace(pattern, makeReplacement);
}
export function prepareEdits(html, inventory, fy27, lifetime, funds) {
  check(Number.isFinite(fy27) && fy27 >= 0, 'FY27 pounds invalid');
  check(Number.isFinite(lifetime) && lifetime >= fy27, 'Lifetime pounds invalid');
  check(Number.isFinite(funds) && funds >= 0, 'Fundraising total invalid');

  // Fundraising is separately maintained. Validate its structure, but report
  // divergence instead of blocking independent collection updates, as Drew
  // explicitly authorized in STH-WEBSITE-SYNC-COMPLETE-20261026-08.
  const fundraiser = [...html.matchAll(/\$([\d,]+) raised/g)];
  check(fundraiser.length === 2, 'Expected desktop and mobile fundraising labels');
  const fundraisingDiverged = fundraiser.some(label =>
    Number(label[1].replaceAll(',', '')) !== Math.round(funds));

  const lifeLabel = roundPounds(lifetime);
  const fyLabel = roundPounds(fy27);
  const percent = (100 * fy27 / GOAL).toFixed(2);
  const updatedHtml = [
    [/(<b>)[\d,]+( pounds<\/b> - Collected and Redistributed)/g,
      (_m, a, b) => a + lifeLabel + b, 'homepage lifetime'],
    [/(Goal:<br>)[\d,]+(\/20,000)/g,
      (_m, a, b) => a + fyLabel + b, 'homepage FY27 goal'],
    [/(class="eael-progressbar eael-progressbar-circle"[^>]*data-count=")[\d.]+("(?:(?!class="eael-progressbar eael-progressbar-circle").){0,2500}?Goal:<br>[\d,]+\/20,000)/gs,
      (_m, a, b) => a + percent + b, 'homepage FY27 percentage'],
  ].reduce((text, [pattern, cb, label]) =>
    replaceExactlyOnce(text, pattern, cb, label), html);

  // Inventory.json is a maintained migration baseline, not the authoritative
  // storage sheet; update only the two corresponding strings in its bodyText.
  let updatedInventory = replaceExactlyOnce(inventory,
    /(Since December 2023… )[\d,]+( pounds - Collected and Redistributed)/g,
    (_m, a, b) => a + lifeLabel + b, 'baseline lifetime');
  updatedInventory = replaceExactlyOnce(updatedInventory,
    /(Goal:)[\d,]+(\/20,000)/g,
    (_m, a, b) => a + fyLabel + b, 'baseline FY27 goal');
  JSON.parse(updatedInventory);
  return { html: updatedHtml, inventory: updatedInventory, fyLabel, lifeLabel, percent, fundraisingDiverged };
}

export async function readSheet(token, id, range, fetchImpl = fetch, render = 'UNFORMATTED_VALUE') {
  const allowed = new Map([
    [INVENTORY_ID, ['FY27!A1:B5', 'FY27!G7:H1000']],
    [FUNDRAISING_ID, ['FY27!A1:B1']],
  ]);
  check(allowed.get(id)?.includes(range), 'Unapproved source or range');
  const url = 'https://sheets.googleapis.com/v4/spreadsheets/' +
    encodeURIComponent(id) + '/values/' + encodeURIComponent(range) +
    '?valueRenderOption=' + render;
  let r;
  try { r = await fetchImpl(url, { headers: { authorization: 'Bearer ' + token }, redirect: 'error' }); }
  catch { throw new Error('Google Sheets request failed; details withheld to protect credentials'); }
  check(r.ok, 'Google Sheets read failed for ' + id + ' (' + r.status + ')');
  return (await r.json()).values || [];
}
export function verifyInventory(summary, rows) {
  check(summary[2]?.[0] === 'FY27 Total' && summary[4]?.[0] === 'Overall',
    'FY27 summary labels moved or changed');
  const fy27 = summary[2][1], lifetime = summary[4][1];
  check(Number.isFinite(fy27) && fy27 >= 0 && Number.isFinite(lifetime) && lifetime >= fy27,
    'Totals must be numeric');
  check(reconciles(lifetime, fy27 + HISTORY_BASELINE),
    'Historical baseline changed; manual reconciliation required');
  let total = 0, count = 0, separator = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    if (String(row[6] || '').includes('----')) { separator = i; break; }
    check(!/^(?:FY27 Total|Overall)$/i.test(String(row[6] ?? '').trim()),
      'Summary label found before collection separator');
    check(!String(row[6] ?? '').trim() || (row[7] !== undefined && row[7] !== ''),
      'Missing collection weight at row ' + (i + 7));
    if (row[7] !== undefined && row[7] !== '') {
      check(typeof row[7] === 'number' && Number.isFinite(row[7]) &&
        row[7] >= 0, 'Invalid numeric collection weight at row ' + (i + 7));
      total += row[7]; count++;
    }
  }
  check(separator >= 0 && count > 0,
    'No collection rows or separator found; source layout changed');
  check(reconciles(total, fy27),
    'Independent FY27 sum differs from B3');
  return { fy27, lifetime, count };
}
export function verifyBaselineFormulas(formulas, values, fy27) {
  const separator = formulas.findIndex(row => String(row?.[0] || '').includes('----'));
  const overall = formulas.findIndex(row => row?.[0] === 'Overall');
  check(separator >= 0 && overall > separator, 'Historical source structure missing');
  const match = /^=SUM\(H(\d+),\s*20855\.4\)$/i.exec(formulas[overall]?.[1]);
  check(match, 'Historical baseline formula changed; reconciliation required');
  const index = Number(match[1]) - 7;
  const sum = /^=SUM\(H6:H(\d+)\)$/i.exec(formulas[index]?.[1]);
  check(index > separator && overall > index && formulas[index]?.[0] === 'FY27 Total' &&
    sum && Number(sum[1]) === separator + 6 &&
    Number.isFinite(values[index]?.[1]) && reconciles(values[index][1], fy27),
    'Historical formula must reference the verified FY27 summary');
}
export async function synchronize({ token, dryRun = true, fetchImpl = fetch,
  htmlPath = 'public/index.html', invPath = 'migration/inventory.json' } = {}) {
  check(typeof token === 'string' && token.length > 0, 'Keyless Google Sheets access token missing');
  const [summary, weights, fundRows, formulas] = await Promise.all([
    readSheet(token, INVENTORY_ID, 'FY27!A1:B5', fetchImpl),
    readSheet(token, INVENTORY_ID, 'FY27!G7:H1000', fetchImpl),
    readSheet(token, FUNDRAISING_ID, 'FY27!A1:B1', fetchImpl),
    readSheet(token, INVENTORY_ID, 'FY27!G7:H1000', fetchImpl, 'FORMULA')
  ]);
  const rows = weights.map(row => [null, null, null, null, null, null, ...row]);
  const { fy27, lifetime, count } = verifyInventory(summary, rows);
  verifyBaselineFormulas(formulas, weights, fy27);
  check(fundRows[0]?.[0] === 'Total for Website' &&
    typeof fundRows[0]?.[1] === 'number',
    'Fundraising label or numeric total invalid');
  const originalHtml = readFileSync(htmlPath, 'utf8');
  const originalInventory = readFileSync(invPath, 'utf8');
  const edited = prepareEdits(originalHtml, originalInventory, fy27, lifetime, fundRows[0][1]);
  if (edited.fundraisingDiverged) {
    console.warn('::warning::Fundraising total differs from the website; collection update continues.');
  }
  const changed = edited.html !== originalHtml || edited.inventory !== originalInventory;
  if (changed && !dryRun) {
    writeFileSync(htmlPath, edited.html);
    writeFileSync(invPath, edited.inventory);
  }
  return { changed, dryRun, fy27, lifetime, count,
    fundraising: fundRows[0][1], publishedFY27: edited.fyLabel,
    publishedLifetime: edited.lifeLabel, percent: edited.percent, fundraisingDiverged: edited.fundraisingDiverged };
}
if (process.argv[1]?.endsWith('sync-homepage-from-sheets.mjs')) {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--dry-run', '--write'].includes(arg)) || (args.includes('--dry-run') && args.includes('--write'))) {
    console.error('Use --dry-run or --write'); process.exitCode = 1;
  } else {
    synchronize({token: process.env.GOOGLE_SHEETS_ACCESS_TOKEN, dryRun: !args.includes('--write')})
      .then(result => console.log(JSON.stringify(result)))
      .catch(() => { console.error('Source authentication, validation, or preparation failed; no credential details logged'); process.exitCode = 1; });
  }
}

