import { readFileSync, writeFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

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
function replaceExactlyOnce(source, pattern, makeReplacement, label) {
  const matches = [...source.matchAll(pattern)];
  check(matches.length === 1, label + ': expected exactly one matching field, found ' + matches.length);
  return source.replace(pattern, makeReplacement);
}
export function prepareEdits(html, inventory, fy27, lifetime, funds) {
  check(Number.isFinite(fy27) && fy27 >= 0, 'FY27 pounds invalid');
  check(Number.isFinite(lifetime) && lifetime >= fy27, 'Lifetime pounds invalid');
  check(Number.isFinite(funds) && funds >= 0, 'Fundraising total invalid');

  // Fundraising is separately maintained. Fail closed on divergence; never
  // silently publish an impact change alongside stale fundraising figures.
  const fundraiser = [...html.matchAll(/\$([\d,]+) raised/g)];
  check(fundraiser.length === 1, 'Expected one visible fundraising label');
  check(Number(fundraiser[0][1].replaceAll(',', '')) === Math.round(funds),
    'Website fundraising label diverges from the authoritative sheet');

  const lifeLabel = roundPounds(lifetime);
  const fyLabel = roundPounds(fy27);
  const percent = (100 * fy27 / GOAL).toFixed(2);
  const updatedHtml = [
    [/(<b>)[\d,]+( pounds<\/b> - Collected and Redistributed)/g,
      (_m, a, b) => a + lifeLabel + b, 'homepage lifetime'],
    [/(Goal:<br>)[\d,]+(\/20,000)/g,
      (_m, a, b) => a + fyLabel + b, 'homepage FY27 goal'],
    [/(class="eael-progressbar eael-progressbar-circle"[^>]*data-count=")[\d.]+(")/g,
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
  return { html: updatedHtml, inventory: updatedInventory, fyLabel, lifeLabel, percent };
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}
async function googleToken(creds) {
  check(creds.type === 'service_account' && creds.client_email &&
    creds.private_key && creds.token_uri, 'Invalid service-account JSON');
  check(creds.token_uri === 'https://oauth2.googleapis.com/token',
    'Unexpected Google OAuth token endpoint');
  const now = Math.floor(Date.now() / 1000);
  const hdr = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: creds.token_uri, iat: now, exp: now + 3000
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(hdr + '.' + body);
  const jwt = hdr + '.' + body + '.' +
    signer.sign(creds.private_key).toString('base64url');
  const r = await fetch(creds.token_uri, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  const json = await r.json();
  check(r.ok && json.access_token, 'Google OAuth failed (' + r.status + ')');
  return json.access_token;
}
async function readSheet(token, id, range) {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets/' +
    encodeURIComponent(id) + '/values/' + encodeURIComponent(range) +
    '?valueRenderOption=UNFORMATTED_VALUE';
  const r = await fetch(url, { headers: { authorization: 'Bearer ' + token } });
  check(r.ok, 'Google Sheets read failed for ' + id + ' (' + r.status + ')');
  return (await r.json()).values || [];
}
export function verifyInventory(summary, rows) {
  check(summary[2]?.[0] === 'FY27 Total' && summary[4]?.[0] === 'Overall',
    'FY27 summary labels moved or changed');
  const fy27 = summary[2][1], lifetime = summary[4][1];
  check(typeof fy27 === 'number' && typeof lifetime === 'number',
    'Totals must be numeric');
  check(Math.abs(lifetime - fy27 - HISTORY_BASELINE) < 0.011,
    'Historical baseline changed; manual reconciliation required');
  let total = 0, count = 0, separator = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    if (String(row[6] || '').includes('----')) { separator = i; break; }
    if (row[7] !== undefined && row[7] !== '') {
      check(typeof row[7] === 'number' && Number.isFinite(row[7]) &&
        row[7] >= 0, 'Invalid numeric collection weight at row ' + (i + 7));
      total += row[7]; count++;
    }
  }
  check(separator >= 0 && count > 0,
    'No collection rows or separator found; source layout changed');
  check(Math.abs(total - fy27) < 0.011,
    'Independent FY27 sum differs from B3');
  return { fy27, lifetime, count };
}
async function main() {
  check(process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    'GOOGLE_SERVICE_ACCOUNT_JSON missing');
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const token = await googleToken(creds);
  const [summary, rows, fundRows] = await Promise.all([
    readSheet(token, INVENTORY_ID, 'FY27!A1:B5'),
    readSheet(token, INVENTORY_ID, 'FY27!A7:H1000'),
    readSheet(token, FUNDRAISING_ID, 'FY27!A1:B1')
  ]);
  const { fy27, lifetime, count } = verifyInventory(summary, rows);
  check(fundRows[0]?.[0] === 'Total for Website' &&
    typeof fundRows[0]?.[1] === 'number',
    'Fundraising label or numeric total invalid');
  const htmlPath = 'public/index.html', invPath = 'migration/inventory.json';
  const originalHtml = readFileSync(htmlPath, 'utf8');
  const originalInventory = readFileSync(invPath, 'utf8');
  const edited = prepareEdits(originalHtml, originalInventory, fy27, lifetime, fundRows[0][1]);
  const changed = edited.html !== originalHtml || edited.inventory !== originalInventory;
  if (changed) {
    writeFileSync(htmlPath, edited.html);
    writeFileSync(invPath, edited.inventory);
  }
  console.log(JSON.stringify({ changed, fy27, lifetime, count,
    fundraising: fundRows[0][1], publishedFY27: edited.fyLabel,
    publishedLifetime: edited.lifeLabel, percent: edited.percent }));
}
if (process.argv[1]?.endsWith('sync-homepage-from-sheets.mjs')) {
  main().catch(e => { console.error(e.message); process.exitCode = 1; });
}
