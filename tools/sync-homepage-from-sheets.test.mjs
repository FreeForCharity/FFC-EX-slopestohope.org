import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareEdits, verifyInventory } from './sync-homepage-from-sheets.mjs';

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
  assert.throws(() => prepareEdits(html, inventory, 5839.3,
    26694.7, 10000));
  assert.throws(() => prepareEdits(html.replace('<span>$9,123 raised</span>',
    '<span>$9,000 raised</span>'), inventory, 5839.3, 26694.7, 9123.03));
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
