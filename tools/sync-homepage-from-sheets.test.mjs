import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEdits, verifyInventory, synchronize } from './sync-homepage-from-sheets.mjs';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const html = '<b>26,620 pounds</b> - Collected and Redistributed' +
  ' <span>$9,123 raised</span><span>$9,123 raised</span>' +
  '<div class="eael-progressbar eael-progressbar-circle" data-count="28.82">' +
  '<div class="eael-progressbar-circle-pie"></div>' +
  '<div class="eael-progressbar-title">' +
  'Goal:<br>5,765/20,000</div>';
const inventory = JSON.stringify({ pages: [{ bodyText:
  'Since December 2023… 26,620 pounds - Collected and Redistributed ' +
  'Goal:5,765/20,000'
}] });
test('updates only the three approved homepage values and two baseline values', () => {
  const updated = prepareEdits(html, inventory, 5839.3, 26694.7, 9123.03);
  assert.match(updated.html, /26,695 pounds/);
  assert.match(updated.html, /Goal:<br>5,839\/20,000/);
  assert.match(updated.html, /data-count="29.20"/);
  assert.match(updated.html, /\$9,123 raised/);
  assert.match(updated.inventory, /26,695 pounds/);
  assert.match(updated.inventory, /Goal:5,839\/20,000/);
  assert.equal(prepareEdits(updated.html, updated.inventory,
    5839.3, 26694.7, 9123.03).html, updated.html);
});
test('stops on unexpected or duplicate fields', () => {
  assert.throws(() => prepareEdits(html + html, inventory, 5839.3,
    26694.7, 9123.03));
  assert.throws(() => prepareEdits(html.replace('Goal:<br>', 'BAD'),
    inventory, 5839.3, 26694.7, 9123.03));
  assert.throws(() => prepareEdits(html, inventory, 5839.3, 26694.7, NaN));
  assert.throws(() => prepareEdits(html.replace('<span>$9,123 raised</span>', ''),
    inventory, 5839.3, 26694.7, 9123.03));
});
test('fundraising divergence is reported without changing fundraising or blocking collection', () => {
  const result = prepareEdits(html, inventory, 5839.3, 26694.7, 10000);
  assert.equal(result.fundraisingDiverged, true);
  assert.equal((result.html.match(/\$9,123 raised/g) || []).length, 2);
  assert.match(result.html, /26,695 pounds/);
  assert.equal(prepareEdits(html, inventory, 5839.3, 26694.7, 9123).fundraisingDiverged, false);
});
test('validates independent sum, historical baseline, and source layout', () => {
  const summary = [[],[],['FY27 Total', 5839.3],[],['Overall',26694.7]];
  const rows = [[,,,,,,,2000],[,,,,,,,3839.3],
    [,,,,,,'-------------------------']];
  assert.equal(verifyInventory(summary, rows).fy27, 5839.3);
  assert.throws(() => verifyInventory(summary,
    [[,,,,,,,2000],[,,,,,,'-------------------------']]));
  assert.throws(() => verifyInventory(summary,
    [[,,,,,,,2000],[,,,,,,,3839.3]]));
  assert.throws(() => verifyInventory([[],[],['FY27 Total', 5839.3],
    [],['Overall',26694.8]], rows));
});
test('a changed write followed by an identical run is a no-change operation; denied auth writes nothing',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'sth-sync-test-'));
  const htmlPath=join(dir,'index.html'),invPath=join(dir,'inventory.json');
  writeFileSync(htmlPath,html);writeFileSync(invPath,inventory);
  const weights=[['',5839.3],['----'],['FY27 Total',5839.3],[],['Overall',26694.7]];
  const formulas=[...weights];formulas[2]=['FY27 Total','=SUM(H6:H7)'];formulas[4]=['Overall','=SUM(H9, 20855.4)'];
  const fetchImpl=async address=>{
    const url=new URL(address),range=decodeURIComponent(url.pathname.split('/values/')[1]);
    const values=range==='FY27!A1:B5'?[[],[],['FY27 Total',5839.3],[],['Overall',26694.7]]:
      range==='FY27!A1:B1'?[['Total for Website',9123.03]]:url.searchParams.get('valueRenderOption')==='FORMULA'?formulas:weights;
    return {ok:true,json:async()=>({values})};
  };
  try {
    const options={token:'local-test-only',fetchImpl,htmlPath,invPath,dryRun:false};
    assert.equal((await synchronize(options)).changed,true);
    const before=[readFileSync(htmlPath),readFileSync(invPath)];
    assert.equal((await synchronize(options)).changed,false);
    assert.deepEqual([readFileSync(htmlPath),readFileSync(invPath)],before);
    await assert.rejects(synchronize({...options,fetchImpl:async()=>({ok:false,status:403})}));
    assert.deepEqual([readFileSync(htmlPath),readFileSync(invPath)],before);
  }finally{assert.ok(dir.startsWith(join(tmpdir(),'sth-sync-test-')));rmSync(dir,{recursive:true,force:true});}
});

