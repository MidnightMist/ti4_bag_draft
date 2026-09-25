import { getActiveBlueTiles } from './blueTiles.js';

/**
 * Validates blue tile distribution across 3 tiers considering active expansions.
 * @param {{ tier1: string | number[], tier2: string | number[], tier3: string | number[] }} rawTiers
 * @param {{ pok?: boolean, thundersEdge?: boolean }} expansions
 * @returns {{ isValid: boolean, error?: string, parsed?: { tier1: number[], tier2: number[], tier3: number[] } }}
 */
export function validateBlueTiers(rawTiers, expansions = { pok: true, thundersEdge: true }) {
  const activeBlueList = getActiveBlueTiles(expansions);
  const activeBlueSet = new Set(activeBlueList);

  const parseTier = (tierValue, tierName) => {
    if (tierValue === undefined || tierValue === null) {
      return { numbers: [], invalidTokens: [] };
    }
    if (Array.isArray(tierValue)) {
      const numbers = [];
      const invalidTokens = [];
      for (const item of tierValue) {
        const num = Number(item);
        if (Number.isInteger(num) && num > 0) {
          numbers.push(num);
        } else {
          invalidTokens.push(String(item));
        }
      }
      return { numbers, invalidTokens };
    }
    if (typeof tierValue !== 'string') {
      return { numbers: [], invalidTokens: ['invalid value'] };
    }

    const tokens = tierValue.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    const numbers = [];
    const invalidTokens = [];

    for (const token of tokens) {
      const num = Number(token);
      if (Number.isInteger(num) && num > 0) {
        numbers.push(num);
      } else {
        invalidTokens.push(token);
      }
    }
    return { numbers, invalidTokens };
  };

  const parsed1 = parseTier(rawTiers.tier1, 'Tier 1');
  const parsed2 = parseTier(rawTiers.tier2, 'Tier 2');
  const parsed3 = parseTier(rawTiers.tier3, 'Tier 3');

  // 1. Check for non-numeric/invalid tokens
  if (parsed1.invalidTokens.length > 0) {
    return {
      isValid: false,
      error: `Invalid values found in "Tier 1": ${parsed1.invalidTokens.join(', ')}`
    };
  }
  if (parsed2.invalidTokens.length > 0) {
    return {
      isValid: false,
      error: `Invalid values found in "Tier 2": ${parsed2.invalidTokens.join(', ')}`
    };
  }
  if (parsed3.invalidTokens.length > 0) {
    return {
      isValid: false,
      error: `Invalid values found in "Tier 3": ${parsed3.invalidTokens.join(', ')}`
    };
  }

  // 2. Check that tiles belong to active blue tiles
  const checkUnknown = (nums, tierLabel) => {
    const unknown = nums.filter(num => !activeBlueSet.has(num));
    if (unknown.length > 0) {
      return `"${tierLabel}" contains tiles that are not blue tiles in the selected expansions: ${unknown.join(', ')}`;
    }
    return null;
  };

  const unknownErr1 = checkUnknown(parsed1.numbers, 'Tier 1');
  if (unknownErr1) return { isValid: false, error: unknownErr1 };

  const unknownErr2 = checkUnknown(parsed2.numbers, 'Tier 2');
  if (unknownErr2) return { isValid: false, error: unknownErr2 };

  const unknownErr3 = checkUnknown(parsed3.numbers, 'Tier 3');
  if (unknownErr3) return { isValid: false, error: unknownErr3 };

  // 3. Check for duplicates within each tier row
  const findDuplicatesWithin = (nums, tierLabel) => {
    const seen = new Set();
    const duplicates = new Set();
    for (const n of nums) {
      if (seen.has(n)) {
        duplicates.add(n);
      } else {
        seen.add(n);
      }
    }
    if (duplicates.size > 0) {
      return `Duplicate tiles found in "${tierLabel}": ${Array.from(duplicates).join(', ')}`;
    }
    return null;
  };

  const dupWithin1 = findDuplicatesWithin(parsed1.numbers, 'Tier 1');
  if (dupWithin1) return { isValid: false, error: dupWithin1 };

  const dupWithin2 = findDuplicatesWithin(parsed2.numbers, 'Tier 2');
  if (dupWithin2) return { isValid: false, error: dupWithin2 };

  const dupWithin3 = findDuplicatesWithin(parsed3.numbers, 'Tier 3');
  if (dupWithin3) return { isValid: false, error: dupWithin3 };

  // 4. Check for overlaps between tiers
  const set1 = new Set(parsed1.numbers);
  const set2 = new Set(parsed2.numbers);
  const set3 = new Set(parsed3.numbers);

  const overlap12 = parsed1.numbers.filter(n => set2.has(n));
  if (overlap12.length > 0) {
    return {
      isValid: false,
      error: `Tiles overlap between "Tier 1" and "Tier 2": ${Array.from(new Set(overlap12)).join(', ')}`
    };
  }

  const overlap13 = parsed1.numbers.filter(n => set3.has(n));
  if (overlap13.length > 0) {
    return {
      isValid: false,
      error: `Tiles overlap between "Tier 1" and "Tier 3": ${Array.from(new Set(overlap13)).join(', ')}`
    };
  }

  const overlap23 = parsed2.numbers.filter(n => set3.has(n));
  if (overlap23.length > 0) {
    return {
      isValid: false,
      error: `Tiles overlap between "Tier 2" and "Tier 3": ${Array.from(new Set(overlap23)).join(', ')}`
    };
  }

  // 5. Check that ALL blue tiles of active expansions are assigned
  const allSpecified = new Set([...parsed1.numbers, ...parsed2.numbers, ...parsed3.numbers]);
  const missingTiles = activeBlueList.filter(tileId => !allSpecified.has(tileId));

  if (missingTiles.length > 0) {
    return {
      isValid: false,
      error: `Not all blue tiles are assigned! Missing tiles (${missingTiles.length} of ${activeBlueList.length}): ${missingTiles.join(', ')}`
    };
  }

  return {
    isValid: true,
    parsed: {
      tier1: parsed1.numbers,
      tier2: parsed2.numbers,
      tier3: parsed3.numbers
    }
  };
}
