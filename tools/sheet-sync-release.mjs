import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { synchronize, prepareEdits } from './sync-homepage-from-sheets.mjs';
import {verifyLive, expectedFigures} from './verify-live-impact.mjs';

const REPO = 'FreeForCharity/FFC-EX-slopestohope.org';
const PREFIX = 'automation/sheet-pounds-';
class ReleaseError extends Error {}
function check(ok, message) { if (!ok) throw new ReleaseError(message); }
function gh(args) {
  try { return execFileSync('gh', args, {encoding:'utf8', stdio:['ignore','pipe','pipe'], maxBuffer:20_000_000}); }
  catch { throw new ReleaseError('GitHub operation failed; inspect permissions and the workflow stage (credential details withheld)'); }
}
function api(path) { return JSON.parse(gh(['api', path])); }
function pages(path) { return JSON.parse(gh(['api', '--paginate', '--slurp', path])).flat(); }
function git(...args) { try { return execFileSync('git', args, {encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim(); } catch { throw new ReleaseError('Git operation failed; inspect the workflow stage (credential details withheld)'); } }
export function pendingSyncPRs(prs) {
  return prs.filter(pr => pr.state === 'open' && /^(automation\/(sheet-pounds-|source-sync|website-sync|impact-sync)|impact-sync)/.test(pr.head?.ref || ''));
}
export function reviewGate({head, reviews, threads, checks, statuses}, expectedHead) {
  check(head === expectedHead, 'PR changed after validation');
  check(!threads.some(thread => !thread.isResolved), 'Unresolved review findings block release');
  const latest = new Map();
  for (const review of reviews) if (['APPROVED','CHANGES_REQUESTED'].includes(review.state)) latest.set(review.user.login, review);
  check(![...latest.values()].some(r => r.state === 'CHANGES_REQUESTED'), 'Changes requested; release blocked');
  const copilot = reviews.filter(r => r.user?.login === 'copilot-pull-request-reviewer[bot]' && r.commit_id === expectedHead).at(-1);
  check(copilot && !/changes recommended|needs a closer look|previously missed issue/i.test(copilot.body || '') && (copilot.state === 'APPROVED' || (copilot.state === 'COMMENTED' && /no (?:open )?issues|found no issues|did not (?:find|identify) any issues/i.test(copilot.body || ''))), 'Current-head Copilot completion without findings not verified');
  check(checks.some(c => c.name === 'migration' && c.conclusion === 'success'), 'Migration QA has not passed');
  check(checks.some(c => c.name === 'pnpm audit (production)' && c.conclusion === 'success'), 'Security audit has not passed');
  check(checks.length > 0 && checks.every(c => c.status === 'completed' && ['success','neutral','skipped'].includes(c.conclusion)), 'Failed or pending GitHub checks');
  check(statuses.every(s => s.state === 'success'), 'Failed or pending commit status');
  return true;
}
export function unchangedSource(before, now) {
  return ['fy27','lifetime','count','percent'].every(key => before[key] === now[key]);
}
export function verifyPatHeaders(headers, now=Date.now()) {
  const scope=(headers['x-oauth-scopes']||'').split(',').map(s=>s.trim()).filter(Boolean);
  check(scope.length===1 && scope[0]==='public_repo','Production PAT must have exactly public_repo scope');
  const expires=Date.parse(headers['github-authentication-token-expiration']||'');
  check(Number.isFinite(expires) && expires>now && expires<=now+90*86400000,'Production PAT needs a valid finite expiration within 90 days');
  check(expires!==Date.parse('2026-11-03T00:00:33Z'),'Temporary pilot PAT is forbidden for production');
  return {expires:new Date(expires).toISOString(),expiring:expires-now<14*86400000};
}
export function assertAllowedDiff(html, inventory, editedHtml, editedInventory, source) {
  const expected = prepareEdits(html, inventory, source.fy27, source.lifetime, source.fundraising);
  check(expected.html === editedHtml && expected.inventory === editedInventory, 'Diff contains an unauthorized field change');
}
function output(name, value) { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`); }
function authenticate() {
  check(process.env.GH_TOKEN, 'Production GitHub credential missing');
  let user;
  if (process.env.STH_GH_APP_SLUG) {
    check(/^[a-z0-9-]+$/.test(process.env.STH_GH_APP_SLUG),'Unexpected GitHub App identity');
    const installed=api('installation/repositories?per_page=100');
    check(installed.total_count===1 && installed.repositories[0]?.id===1128665669,'Installation token must be restricted to the intended repository');
    user=api(`users/${process.env.STH_GH_APP_SLUG}[bot]`);
  } else {
    const response=gh(['api','--include','user']);
    const boundary=/\r?\n\r?\n/.exec(response);
    check(boundary,'GitHub authentication metadata missing');
    const headers=Object.fromEntries(response.slice(0,boundary.index).split(/\r?\n/).filter(l=>l.includes(':')).map(line=>{const i=line.indexOf(':');return [line.slice(0,i).toLowerCase(),line.slice(i+1).trim()];}));
    const validity=verifyPatHeaders(headers);
    output('credential_expiring',validity.expiring);
    user=JSON.parse(response.slice(boundary.index+boundary[0].length));
    check(user.login === 'drewrobertssth', 'Unexpected production GitHub identity');
  }
  const repo = api(`repos/${REPO}`);
  check(repo.id===1128665669 && (process.env.STH_GH_APP_SLUG || repo.permissions?.push===true), 'Production repository identity or permission invalid');
  return user;
}
async function prepare() {
  const user=authenticate();
  const pending = pendingSyncPRs(pages(`repos/${REPO}/pulls?state=open&per_page=100`));
  check(pending.length === 0, 'An earlier numerical update PR is still pending; no duplicate will be created');
  const beforeHtml = readFileSync('public/index.html','utf8');
  const beforeInv = readFileSync('migration/inventory.json','utf8');
  const source = await synchronize({token:process.env.GOOGLE_SHEETS_ACCESS_TOKEN, dryRun:false});
  assertAllowedDiff(beforeHtml, beforeInv, readFileSync('public/index.html','utf8'), readFileSync('migration/inventory.json','utf8'), source);
  writeFileSync('/tmp/sth-source.json', JSON.stringify(source));
  output('changed', source.changed); output('fundraising_warning', source.fundraisingDiverged);
  if (!source.changed) return;
  const allowed = ['migration/inventory.json','public/index.html'];
  check(git('diff','--name-only').split('\n').sort().every(path => allowed.includes(path)), 'Unexpected changed path');
  git('config','user.name',user.login);
  git('config','user.email',`${user.id}+${user.login}@users.noreply.github.com`);
  const branch = PREFIX + process.env.GITHUB_RUN_ID;
  git('switch','-c',branch);
  git('add','--',...allowed);
  git('commit','-m',`Update verified FY27 collection to ${source.publishedFY27} pounds`);
  // gh's git credential helper reads GH_TOKEN from the environment; the token
  // is never interpolated into arguments, URLs, git config, or files.
  gh(['auth','setup-git']);
  git('push','origin',`HEAD:refs/heads/${branch}`);
  const body = `Verified independently from authorized Google Sheets.\n\nFY27: ${source.publishedFY27} pounds; lifetime: ${source.publishedLifetime} pounds; progress: ${source.percent}%.\n\nOnly collection figures and their migration baseline change. Fundraising is separately maintained.\n\n<!-- sth-verified-pounds -->`;
  const created = gh(['pr','create','--repo',REPO,'--base','main','--head',branch,'--title',`Update verified FY27 collection to ${source.publishedFY27} pounds`,'--body',body]).trim();
  const number = Number(created.split('/').at(-1)); check(Number.isInteger(number), 'PR creation not confirmed');
  const state = {number,head:git('rev-parse','HEAD'),branch,source};
  writeFileSync('/tmp/sth-release.json', JSON.stringify(state)); output('pr',number);
}
function snapshot(number) {
  const pr = api(`repos/${REPO}/pulls/${number}`);
  const all = JSON.parse(gh(['api','graphql','--paginate','--slurp','-f',`query=query($endCursor:String){repository(owner:"FreeForCharity",name:"FFC-EX-slopestohope.org"){pullRequest(number:${number}){reviewThreads(first:100,after:$endCursor){nodes{isResolved}pageInfo{hasNextPage endCursor}}}}}`]));
  return {head:pr.head.sha,reviews:pages(`repos/${REPO}/pulls/${number}/reviews?per_page=100`),
    threads:all.flatMap(p=>p.data.repository.pullRequest.reviewThreads.nodes),
    checks:JSON.parse(gh(['api','--paginate','--slurp',`repos/${REPO}/commits/${pr.head.sha}/check-runs?per_page=100`])).flatMap(p=>p.check_runs),
    statuses:pages(`repos/${REPO}/commits/${pr.head.sha}/statuses?per_page=100`).filter((s,i,a)=>a.findIndex(x=>x.context===s.context)===i)};
}
async function waitReviews() {
  const state = JSON.parse(readFileSync('/tmp/sth-release.json','utf8'));
  const deadline = Date.now()+25*60*1000;
  let last = 'Review/QA not yet complete';
  while (Date.now()<deadline) {
    const current = snapshot(state.number);
    try { reviewGate(current,state.head); return; } catch (error) { last = error.message; }
    if (current.head !== state.head || current.threads.some(t=>!t.isResolved) || current.checks.some(c=>['failure','cancelled','timed_out','action_required'].includes(c.conclusion))) throw new Error(last);
    await new Promise(resolve=>setTimeout(resolve,30000));
  }
  throw new Error(last);
}
async function enqueue() {
  const state=JSON.parse(readFileSync('/tmp/sth-release.json','utf8'));
  const source = await synchronize({token:process.env.GOOGLE_SHEETS_ACCESS_TOKEN});
  output('fundraising_warning',source.fundraisingDiverged);
  check(unchangedSource(state.source,source), 'Sources changed during review; this release is stale');
  reviewGate(snapshot(state.number),state.head);
  try {
  gh(['pr','merge',String(state.number),'--repo',REPO,'--auto','--match-head-commit',state.head]);
  const deadline=Date.now()+40*60*1000;
  while (Date.now()<deadline) {
    const pr=api(`repos/${REPO}/pulls/${state.number}`);
    check(pr.head.sha===state.head,'PR head changed while queued');
    if (pr.merged) { output('merged_sha',pr.merge_commit_sha); return; }
    check(pr.state==='open','PR closed without merging');
    const current=snapshot(state.number);
    reviewGate(current,state.head);
    await new Promise(resolve=>setTimeout(resolve,30000));
  }
  throw new Error('Merge queue did not complete within 40 minutes; inspect the PR and queue');
  } catch(error) {
    // Stop a delayed release when this run cannot establish its safety.
    try { gh(['pr','merge',String(state.number),'--repo',REPO,'--disable-auto']); } catch {}
    try {
      const id=api(`repos/${REPO}/pulls/${state.number}`).node_id;
      gh(['api','graphql','-f',`query=mutation{dequeuePullRequest(input:{pullRequestId:"${id}"}){clientMutationId}}`]);
    } catch { console.warn('::warning::Could not confirm queue removal; inspect the PR immediately.'); }
    throw error;
  }
}
async function published() {
  const sha=process.env.EXPECTED_SHA;
  check(/^[a-f0-9]{40}$/.test(sha||''),'Merged revision missing');
  git('fetch','origin',sha);
  const expected=expectedFigures(git('show',`${sha}:public/index.html`));
  const deadline=Date.now()+15*60*1000;
  while(Date.now()<deadline) {
    const runs=api(`repos/${REPO}/actions/workflows/deploy.yml/runs?head_sha=${sha}&event=push&per_page=20`).workflow_runs;
    if(runs.some(r=>r.status==='completed' && r.conclusion!=='success'))throw new Error('GitHub Pages deployment failed');
    if(runs.some(r=>r.conclusion==='success')) {
      console.log(JSON.stringify({verified:true,sha,...await verifyLive({expected})})); return;
    }
    await new Promise(resolve=>setTimeout(resolve,15000));
  }
  throw new Error('GitHub Pages deployment did not complete in time');
}
if (process.argv[1]?.endsWith('sheet-sync-release.mjs')) {
  const tasks={prepare,review:waitReviews,enqueue,published,credential:()=>{const user=authenticate();console.log(JSON.stringify({authentication:'PASS',identity:user.login,repository:REPO}));}};
  Promise.resolve().then(()=>{check(tasks[process.argv[2]],'Unknown release stage');return tasks[process.argv[2]]();})
    .catch(error=>{console.error(error instanceof ReleaseError ? error.message : 'Release stopped at this stage; raw details withheld to protect credentials');process.exitCode=1;});
}
