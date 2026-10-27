import test from 'node:test';
import assert from 'node:assert/strict';
import {pendingSyncPRs,reviewGate,unchangedSource,assertAllowedDiff,verifyPatHeaders} from './sheet-sync-release.mjs';
import {comparePublished,expectedFigures,verifyLive} from './verify-live-impact.mjs';
import {verifyBaselineFormulas,verifyInventory} from './sync-homepage-from-sheets.mjs';
const html='<b>26,799 pounds</b> - Collected and Redistributed $9,123 raised $9,123 raised <div class="eael-progressbar eael-progressbar-circle" data-count="29.72">Goal:<br>5,943/20,000';
const pass={head:'abc',reviews:[{user:{login:'copilot-pull-request-reviewer[bot]'},state:'COMMENTED',commit_id:'abc',body:'No open issues found.'}],threads:[],checks:[{name:'migration',status:'completed',conclusion:'success'},{name:'pnpm audit (production)',status:'completed',conclusion:'success'}],statuses:[]};
test('duplicate pending releases are blocked, and unrelated PRs ignored',()=>{
  assert.equal(pendingSyncPRs([{state:'open',head:{ref:'automation/sheet-pounds-1'}},{state:'closed',head:{ref:'automation/sheet-pounds-2'}},{state:'open',head:{ref:'feature/else'}}]).length,1);
});
test('release requires current-head Copilot, resolved findings, QA, statuses, and unchanged head',()=>{
  assert.equal(reviewGate(pass,'abc'),true);
  for(const bad of [
    {...pass,head:'changed'}, {...pass,reviews:[]},
    {...pass,reviews:[{...pass.reviews[0],commit_id:'old'}]},
    {...pass,reviews:[{...pass.reviews[0],body:'Found 1 issue'}]},
    {...pass,threads:[{isResolved:false}]},
    {...pass,checks:[{name:'migration',status:'completed',conclusion:'failure'}]},
    {...pass,checks:[]}, {...pass,statuses:[{state:'pending'}]},
    {...pass,reviews:[...pass.reviews,{user:{login:'human'},state:'CHANGES_REQUESTED'}]}
  ]) assert.throws(()=>reviewGate(bad,'abc'));
});
test('source freshness prevents a stale proposal being queued',()=>{
  const a={fy27:5943.2,lifetime:26798.6,fundraising:9123.03,count:48,percent:'29.72'};
  assert.equal(unchangedSource(a,{...a}),true);
  for(const key of Object.keys(a))assert.equal(unchangedSource(a,{...a,[key]:'changed'}),false);
});
test('allowed diff rejects a hidden unrelated change',()=>{
  const inv=JSON.stringify({bodyText:'Since December 2023… 26,799 pounds - Collected and Redistributed Goal:5,943/20,000'});
  const source={fy27:5943.2,lifetime:26798.6,fundraising:9123.03};
  assertAllowedDiff(html,inv,html,inv,source);
  assert.throws(()=>assertAllowedDiff(html,inv,html+'<script>unexpected</script>',inv,source));
});
test('live verification rejects HTTP, deployment, layout, and numerical failures',async()=>{
  const expected=expectedFigures(html);
  assert.deepEqual(comparePublished(expected,html),expected);
  assert.throws(()=>comparePublished(expected,html.replace('26,799','26,798')));
  await assert.rejects(verifyLive({expected,attempts:1,fetchImpl:async()=>({ok:false})}));
  await assert.rejects(verifyLive({expected,attempts:1,fetchImpl:async()=>({ok:true,text:async()=>html.replace('29.72','29.71')})}));
  let count=0;
  assert.deepEqual(await verifyLive({expected,attempts:2,delay:0,fetchImpl:async()=>({ok:true,text:async()=>++count===1?'old':html})}),expected);
});
test('historical baseline must remain in the source formula structure',()=>{
  const values=[['FY27 Total',5943.2],[],['Overall',26798.6]];
  const formulas=[['FY27 Total','=SUM(H6:H62)'],[],['Overall','=SUM(H7, 20855.4)']];
  verifyBaselineFormulas(formulas,values,5943.2);
  assert.throws(()=>verifyBaselineFormulas([formulas[0],[],['Overall','=SUM(H7, 20856.4)']],values,5943.2));
  assert.throws(()=>verifyBaselineFormulas(formulas,values,1));
});
test('invalid weights and moved summary labels fail closed',()=>{
  const summary=[[],[],['FY27 Total',1],[],['Overall',20856.4]];
  for(const weight of [-1,'1',NaN,Infinity])assert.throws(()=>verifyInventory(summary,[[,,,,,,,weight],[,,,,,,'----']]));
  assert.throws(()=>verifyInventory([[],[],['Moved',1]],[]));
});
test('Denver 23:59 remains once daily across DST transitions',()=>{
  const fmt=new Intl.DateTimeFormat('en-US',{timeZone:'America/Denver',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  for(const iso of ['2026-03-08T06:59:00Z','2026-03-09T05:59:00Z','2026-11-01T05:59:00Z','2026-11-02T06:59:00Z'])assert.equal(fmt.format(new Date(iso)),'23:59');
});
test('production PAT metadata rejects broader scope, expiry, and the temporary pilot',()=>{
  const now=Date.parse('2026-10-26T00:00:00Z');
  const good={'x-oauth-scopes':'public_repo','github-authentication-token-expiration':'2026-11-25T00:00:00Z'};
  assert.equal(verifyPatHeaders(good,now).expiring,false);
  assert.equal(verifyPatHeaders({...good,'github-authentication-token-expiration':'2026-11-05T00:00:00Z'},now).expiring,true);
  for(const changes of [
    {'x-oauth-scopes':'repo,workflow'},
    {'github-authentication-token-expiration':''},
    {'github-authentication-token-expiration':'2026-01-01T00:00:00Z'},
    {'github-authentication-token-expiration':'2027-10-26T00:00:00Z'},
    {'github-authentication-token-expiration':'2026-11-03T00:00:33Z'},
  ]) assert.throws(()=>verifyPatHeaders({...good,...changes},now));
});
