// Request identity matters: an intentionally blocked POST must not hide a
// subsequent failing GET to the same URL.
export function createRequestAudit(base){
  const blocked=new WeakSet();
  return {
    block(request){blocked.add(request);},
    missing(request){return new URL(request.url()).origin===new URL(base).origin&&!blocked.has(request);},
  };
}
