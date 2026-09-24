import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('homepage supporting sections use level-three headings',async()=>{
  const document=new JSDOM(await readFile('public/index.html','utf8')).window.document;
  const expected=['Mission','Why?','How?','How is it funded?','How can you help?'];
  const actual=[...document.querySelectorAll('h3.elementor-heading-title')].map(element=>element.textContent.trim());
  assert.deepEqual(actual.filter(text=>expected.includes(text)),expected);
  assert.equal(document.querySelectorAll('h5.elementor-heading-title').length,0);
});
