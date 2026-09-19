import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequestAudit} from './request-audit.mjs';
const request=url=>({url:()=>url});
test('blocked telemetry is recorded separately without hiding a real failure at the same URL',()=>{
  const audit=createRequestAudit('http://127.0.0.1:4173');
  const beacon=request('http://127.0.0.1:4173/cdn-cgi/rum');
  audit.block(beacon);
  assert.equal(audit.missing(beacon),false);
  assert.equal(audit.missing(request(beacon.url())),true);
  assert.equal(audit.missing(request('http://127.0.0.1:4173/missing.png')),true);
  assert.equal(audit.missing(request('https://example.com/missing.png')),false);
  assert.equal(audit.missing(request('http://127.0.0.1:41730/missing.png')),false);
});
