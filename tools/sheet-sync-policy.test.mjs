import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('workflow authentication, scheduling, and trust remain narrowly scoped',()=>{
  const workflow=read('.github/workflows/nightly-pounds.yml');
  assert.match(workflow,/cron: '59 23 \* \* \*'\s+timezone: America\/Denver/);
  assert.match(workflow,/vars\.STH_SYNC_ACTIVE == 'true'/);
  assert.doesNotMatch(workflow,/STH_SYNC_GH_PILOT_TOKEN|SERVICE_ACCOUNT_JSON|--admin|pull_request_target/);
  assert.match(workflow,/access_token_scopes: https:\/\/www\.googleapis\.com\/auth\/spreadsheets\.readonly/);
  assert.match(workflow,/persist-credentials: false/);
  assert.match(read('.github/workflows/migration-qa.yml'),/merge_group:/);
  assert.match(read('.github/workflows/security-audit.yml'),/merge_group:/);
  const provider=JSON.parse(read('config/google-provider-production.json'));
  assert.equal(provider.oidc.issuerUri,'https://token.actions.githubusercontent.com');
  assert.deepEqual(provider.oidc.allowedAudiences,['https://iam.googleapis.com/projects/1005944353209/locations/global/workloadIdentityPools/sth-sheet-sync/providers/github-main-sync']);
  for(const [key,value] of Object.entries({repository_id:'1128665669',repository_owner_id:'8795820',repository:'FreeForCharity/FFC-EX-slopestohope.org',ref:'refs/heads/main',workflow_ref:'FreeForCharity/FFC-EX-slopestohope.org/.github/workflows/nightly-pounds.yml@refs/heads/main'})) {
    assert.ok(provider.attributeCondition.includes(`assertion.${key} == '${value}'`));
    assert.equal(provider.attributeMapping['attribute.'+key],'assertion.'+key);
  }
  assert.ok(provider.attributeCondition.endsWith("assertion.event_name in ['schedule', 'workflow_dispatch']"));
});
