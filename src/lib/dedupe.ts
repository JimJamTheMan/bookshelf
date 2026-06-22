// Collapse duplicate-looking search results, keeping the first (most relevant)
// occurrence of each key. Vendors often return many editions/printings of the
// same title; this shows each once.
export function dedupeBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item).trim().toLowerCase();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(item);
  }
  return out;
}
