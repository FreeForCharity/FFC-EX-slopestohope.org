import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPublishedHomepage } from './verify-published-homepage.mjs';

const html = '<b>26,695 pounds</b> - Collected and Redistributed' +
  '<div class="eael-progressbar eael-progressbar-circle" data-count="29.20">' +
  '<div class="eael-progressbar-circle-pie"></div>Goal:<br>5,839/20,000</div>';
test('checks the deployed values and rejects missing, duplicate, or wrong values', () => {
  assert.doesNotThrow(() => verifyPublishedHomepage(html, 5839.3, 26694.7));
  assert.throws(() => verifyPublishedHomepage(html.replace('26,695', '26,694'), 5839.3, 26694.7));
  assert.throws(() => verifyPublishedHomepage(html.replace('29.20', '29.21'), 5839.3, 26694.7));
  assert.throws(() => verifyPublishedHomepage(html + html, 5839.3, 26694.7));
  assert.throws(() => verifyPublishedHomepage('', 5839.3, 26694.7));
  assert.throws(() => verifyPublishedHomepage(html, NaN, 26694.7));
});
