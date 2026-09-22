import { getActiveBlueTiles } from './blueTiles.js';

/**
 * Валидирует распределение синих тайлов по тирам с учетом активных дополнений.
 * @param {{ tier1: string | number[], tier2: string | number[], tier3: string | number[] }} rawTiers
 * @param {{ pok?: boolean, thundersEdge?: boolean }} expansions
 * @returns {{ isValid: boolean, error?: string, parsed?: { tier1: number[], tier2: number[], tier3: number[] } }}
 */
export function validateBlueTiers(rawTiers, expansions = { pok: true, thundersEdge: false }) {
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
      return { numbers: [], invalidTokens: ['некорректное значение'] };
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

  const parsed1 = parseTier(rawTiers.tier1, 'Тир 1');
  const parsed2 = parseTier(rawTiers.tier2, 'Тир 2');
  const parsed3 = parseTier(rawTiers.tier3, 'Тир 3');

  // 1. Проверка на нечисловые/некорректные значения
  if (parsed1.invalidTokens.length > 0) {
    return {
      isValid: false,
      error: `В строке «Тир 1» обнаружены некорректные значения: ${parsed1.invalidTokens.join(', ')}`
    };
  }
  if (parsed2.invalidTokens.length > 0) {
    return {
      isValid: false,
      error: `В строке «Тир 2» обнаружены некорректные значения: ${parsed2.invalidTokens.join(', ')}`
    };
  }
  if (parsed3.invalidTokens.length > 0) {
    return {
      isValid: false,
      error: `В строке «Тир 3» обнаружены некорректные значения: ${parsed3.invalidTokens.join(', ')}`
    };
  }

  // 2. Проверка, что используются только номера синих тайлов из активных дополнений
  const checkUnknown = (nums, tierLabel) => {
    const unknown = nums.filter(num => !activeBlueSet.has(num));
    if (unknown.length > 0) {
      return `В строке «${tierLabel}» указаны тайлы, не входящие в синие тайлы выбранных дополнений: ${unknown.join(', ')}`;
    }
    return null;
  };

  const unknownErr1 = checkUnknown(parsed1.numbers, 'Тир 1');
  if (unknownErr1) return { isValid: false, error: unknownErr1 };

  const unknownErr2 = checkUnknown(parsed2.numbers, 'Тир 2');
  if (unknownErr2) return { isValid: false, error: unknownErr2 };

  const unknownErr3 = checkUnknown(parsed3.numbers, 'Тир 3');
  if (unknownErr3) return { isValid: false, error: unknownErr3 };

  // 3. Проверка на дубликаты внутри одной строки
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
      return `В строке «${tierLabel}» есть повторяющиеся тайлы: ${Array.from(duplicates).join(', ')}`;
    }
    return null;
  };

  const dupWithin1 = findDuplicatesWithin(parsed1.numbers, 'Тир 1');
  if (dupWithin1) return { isValid: false, error: dupWithin1 };

  const dupWithin2 = findDuplicatesWithin(parsed2.numbers, 'Тир 2');
  if (dupWithin2) return { isValid: false, error: dupWithin2 };

  const dupWithin3 = findDuplicatesWithin(parsed3.numbers, 'Тир 3');
  if (dupWithin3) return { isValid: false, error: dupWithin3 };

  // 4. Проверка на пересечения (дубликаты) между строками
  const set1 = new Set(parsed1.numbers);
  const set2 = new Set(parsed2.numbers);
  const set3 = new Set(parsed3.numbers);

  const overlap12 = parsed1.numbers.filter(n => set2.has(n));
  if (overlap12.length > 0) {
    return {
      isValid: false,
      error: `Тайлы повторяются между «Тир 1» и «Тир 2»: ${Array.from(new Set(overlap12)).join(', ')}`
    };
  }

  const overlap13 = parsed1.numbers.filter(n => set3.has(n));
  if (overlap13.length > 0) {
    return {
      isValid: false,
      error: `Тайлы повторяются между «Тир 1» и «Тир 3»: ${Array.from(new Set(overlap13)).join(', ')}`
    };
  }

  const overlap23 = parsed2.numbers.filter(n => set3.has(n));
  if (overlap23.length > 0) {
    return {
      isValid: false,
      error: `Тайлы повторяются между «Тир 2» и «Тир 3»: ${Array.from(new Set(overlap23)).join(', ')}`
    };
  }

  // 5. Проверка, что ВСЕ синие тайлы активных дополнений указаны в строчках
  const allSpecified = new Set([...parsed1.numbers, ...parsed2.numbers, ...parsed3.numbers]);
  const missingTiles = activeBlueList.filter(tileId => !allSpecified.has(tileId));

  if (missingTiles.length > 0) {
    return {
      isValid: false,
      error: `Не все синие тайлы распределены! Пропущено тайлов (${missingTiles.length} из ${activeBlueList.length}): ${missingTiles.join(', ')}`
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
