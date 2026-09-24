import assert from 'node:assert/strict';
import test from 'node:test';
import {JSDOM} from 'jsdom';
import {applyViewportAndHomepageInquiryPolicy} from './release-policy.mjs';
import {hasRestrictiveViewportDirective} from './viewport-policy.mjs';

test('viewport policy removes every restrictive directive while retaining valid directives',()=>{
  const document=new JSDOM('<head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=no"></head><body></body>').window.document;
  applyViewportAndHomepageInquiryPolicy(document,'/team/');
  const content=document.querySelector('meta[name="viewport"]').content;
  assert.equal(content,'width=device-width, initial-scale=1');
  assert.equal(hasRestrictiveViewportDirective(content),false);
});

test('viewport regression detector catches future maximum-scale and user-scalable restrictions',()=>{
  assert.equal(hasRestrictiveViewportDirective('width=device-width, maximum-scale=1'),true);
  assert.equal(hasRestrictiveViewportDirective('width=device-width, maximum-scale=2'),true);
  assert.equal(hasRestrictiveViewportDirective('width=device-width, user-scalable=no'),true);
  assert.equal(hasRestrictiveViewportDirective('width=device-width, user-scalable=yes'),false);
});

test('homepage inquiry CTAs retain the verified HubSpot prefill values',()=>{
  const document=new JSDOM('<head></head><body><a class="elementskit-btn" href="/contact-us/">Volunteer</a><a class="elementskit-btn" href="/contact-us/">Partner</a></body>').window.document;
  applyViewportAndHomepageInquiryPolicy(document,'/');
  const ctas=[...document.querySelectorAll('a')];
  assert.equal(ctas[0].getAttribute('href'),'/contact-us/?initial_inquiry=FDzWWvIE8BnvAFjK-rnd3');
  assert.equal(ctas[1].getAttribute('href'),'/contact-us/?initial_inquiry=pLvTcP1Yx2esDFetkizjy');
});
