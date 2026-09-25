export function isRestrictiveViewportDirective(directive){
  return /^(?:maximum-scale\s*=|user-scalable\s*=\s*no\s*$)/i.test(directive.trim());
}

export function hasRestrictiveViewportDirective(content=''){
  return content.split(',').some(isRestrictiveViewportDirective);
}
