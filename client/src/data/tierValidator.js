import { getActiveBlueTiles } from './blueTiles.js';

/**
 * Validates blue tile distribution across 3 tiers considering active expansions.
 * @param {{ tier1: string | number[], tier2: string | number[], tier3: string | number[] }} rawTiers
 * @param {{ pok?: boolean, thundersEdge?: boolean }} expansions
 * @returns {{ isValid: boolean, error?: string, parsed?: { tier1: number[], tier2: number[], tier3: number[] } }}
 */
export function validateBlueTiers(rawTiers = {}, expansions = { pok: true, thundersEdge: true }) {
  const activeBlueList = getActiveBlueTiles(expansions);
  const activeBlueSet = new Set(activeBlueList);

  const parseTier = (val) => {
    if (val === undefined || val === null) return { numbers: [], invalidTokens: [] };
    const tokens = Array.isArray(val) ? val : (typeof val === 'string' ? val.split(/[\s,]+/).filter(Boolean) : [val]);
    const numbers = [];
    const invalidTokens = [];
    for (const item of tokens) {
      const num = Number(item);
      if (Number.isInteger(num) && num > 0) {
        numbers.push(num);
      } else {
        invalidTokens.push(String(item));
      }
    }
    return { numbers, invalidTokens };
  };

  const tiers = [
    { key: 'tier1', label: 'Tier 1', ...parseTier(rawTiers.tier1) },
    { key: 'tier2', label: 'Tier 2', ...parseTier(rawTiers.tier2) },
    { key: 'tier3', label: 'Tier 3', ...parseTier(rawTiers.tier3) }
  ];

  // 1. Invalid non-numeric tokens
  for (const t of tiers) {
    if (t.invalidTokens.length > 0) {
      return { isValid: false, error: `Invalid values found in "${t.label}": ${t.invalidTokens.join(', ')}` };
    }
  }

  // 2. Belongs to active expansions
  for (const t of tiers) {
    const unknown = t.numbers.filter(n => !activeBlueSet.has(n));
    if (unknown.length > 0) {
      return { isValid: false, error: `"${t.label}" contains tiles that are not blue tiles in the selected expansions: ${unknown.join(', ')}` };
    }
  }

  // 3. Duplicates within each tier
  for (const t of tiers) {
    const seen = new Set();
    const dups = [];
    for (const n of t.numbers) {
      if (seen.has(n)) dups.push(n);
      else seen.add(n);
    }
    if (dups.length > 0) {
      return { isValid: false, error: `Duplicate tiles found in "${t.label}": ${[...new Set(dups)].join(', ')}` };
    }
  }

  // 4. Overlaps between tiers
  const pairs = [
    [tiers[0], tiers[1]],
    [tiers[0], tiers[2]],
    [tiers[1], tiers[2]]
  ];
  for (const [a, b] of pairs) {
    const bSet = new Set(b.numbers);
    const overlap = a.numbers.filter(n => bSet.has(n));
    if (overlap.length > 0) {
      return { isValid: false, error: `Tiles overlap between "${a.label}" and "${b.label}": ${[...new Set(overlap)].join(', ')}` };
    }
  }

  // 5. All active blue tiles assigned
  const assigned = new Set(tiers.flatMap(t => t.numbers));
  const missing = activeBlueList.filter(id => !assigned.has(id));
  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Not all blue tiles are assigned! Missing tiles (${missing.length} of ${activeBlueList.length}): ${missing.join(', ')}`
    };
  }

  return {
    isValid: true,
    parsed: {
      tier1: tiers[0].numbers,
      tier2: tiers[1].numbers,
      tier3: tiers[2].numbers
    }
  };
}
