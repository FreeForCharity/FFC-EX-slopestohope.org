// Local preparation only: compare deployed HTML to already validated numbers.
// A caller must tie the expected values to the merged commit and deployment.
export function verifyPublishedHomepage(html, fy27, lifetime) {
  if (!Number.isFinite(fy27) || fy27 < 0 || !Number.isFinite(lifetime) || lifetime < fy27)
    throw new Error('Invalid expected collection figures');
  const pounds = n => Math.round(n).toLocaleString('en-US');
  const checks = [
    [/\<b\>([\d,]+) pounds<\/b> - Collected and Redistributed/g, pounds(lifetime), 'lifetime'],
    [/Goal:<br>([\d,]+)\/20,000/g, pounds(fy27), 'FY27'],
    [/class="eael-progressbar eael-progressbar-circle"[^>]*data-count="([\d.]+)"(?:(?!class="eael-progressbar eael-progressbar-circle").){0,2500}?Goal:<br>[\d,]+\/20,000/gs, (100 * fy27 / 20000).toFixed(2), 'progress'],
  ];
  for (const [pattern, expected, label] of checks) {
    const matches = [...html.matchAll(pattern)];
    if (matches.length !== 1 || matches[0][1] !== expected)
      throw new Error(`Published ${label} figure is missing, ambiguous, or incorrect`);
  }
}
