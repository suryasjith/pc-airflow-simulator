import { PCCase, CPUCooler, GPU, CaseFan } from '../types';
import { fetchComprehensiveMarketData } from './dataFetcher';

export async function loadAllDatasets(): Promise<{
  cases: PCCase[];
  cpuCoolers: CPUCooler[];
  gpus: GPU[];
  fans: CaseFan[];
}> {
  return await fetchComprehensiveMarketData();
}

export function searchItems<T extends { name: string; brand?: string; description?: string }>(
  items: T[],
  query: string,
  limit: number = 60
): T[] {
  if (!query || query.trim() === '') {
    return items.slice(0, limit);
  }

  const cleanQuery = query.toLowerCase().trim();
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);

  const scored: { item: T; score: number }[] = [];

  for (const item of items) {
    const nameLower = item.name.toLowerCase();
    const brandLower = (item.brand || '').toLowerCase();
    const descLower = (item.description || '').toLowerCase();

    // Must match all tokens
    const matchesAll = tokens.every(
      (tok) => nameLower.includes(tok) || brandLower.includes(tok) || descLower.includes(tok)
    );

    if (matchesAll) {
      let score = 0;
      if (nameLower === cleanQuery) score += 100;
      else if (nameLower.startsWith(cleanQuery)) score += 60;
      else if (nameLower.includes(cleanQuery)) score += 40;
      else score += 10;

      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
