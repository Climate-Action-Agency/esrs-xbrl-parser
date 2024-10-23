import { TreeSearchFilter } from '../types/global';

import { ATTRIBUTES_KEY } from './parsing';

export function printJSON(obj: any): void {
  console.log(JSON.stringify(obj, null, 2));
}

export function printObjectTree(
  obj: any,
  maxLevels: number = -1,
  skipKeys: string[] = [],
  currentLevel: number = 0
): void {
  const indentStr = currentLevel > 0 ? `${'  '.repeat(currentLevel)}∟ ` : '';
  if (maxLevels !== -1 && currentLevel >= maxLevels) {
    return;
  }
  for (const key in obj) {
    if (skipKeys.includes(key)) {
      continue;
    }
    if (obj.hasOwnProperty(key)) {
      const textChildStr = typeof obj[key] === 'string' ? `: "${obj[key]}"` : '';
      console.log(indentStr + key + textChildStr);
      // If the value is another object, recursively print its keys
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        printObjectTree(obj[key], maxLevels, skipKeys, currentLevel + 1);
      }
    }
  }
}

export function printXMLTree(obj: any, searchFilter?: TreeSearchFilter, currentLevel: number = 0): void {
  const indentStr = currentLevel > 0 ? `${'  '.repeat(currentLevel)}∟ ` : '';
  // Don't traverse below the maxLevel
  if (searchFilter?.maxLevel !== undefined && currentLevel >= searchFilter?.maxLevel) {
    return;
  }
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Don't traverse the attributes ($) object
      if (key !== ATTRIBUTES_KEY) {
        const hasChildren = typeof obj[key] === 'object' && obj[key] !== null;
        const isTextNode = typeof obj[key] === 'string';
        const attributesObject = hasChildren ? obj[key][ATTRIBUTES_KEY] : undefined;
        const ATTRIBUTES_TO_SHOW_VALUE = ['id', 'type', 'xlink:title', 'xlink:href'];
        const attributesWithValue = Object.keys(attributesObject ?? {})
          .filter((key) => ATTRIBUTES_TO_SHOW_VALUE.includes(key))
          .map((key) => `${key}:'${attributesObject[key]}'`);
        const attributesArray = [
          ...attributesWithValue,
          ...Object.keys(attributesObject ?? {}).filter((key) => !ATTRIBUTES_TO_SHOW_VALUE.includes(key))
        ];
        const attributesStr = attributesObject !== undefined ? ` $\{ ${attributesArray.join(', ')} \}` : '';
        const textChildStr = isTextNode ? `: "${obj[key]}"` : '';
        const completeRowStr = indentStr + key + attributesStr + textChildStr;
        const doShowFilterMatchAndParentNodes =
          !searchFilter?.skipBranches?.includes(key) &&
          !(key === 'children' && obj[key]?.length === 0) && // Don't list empty 'children' arrays
          (searchFilter?.searchText === undefined ||
            (searchFilter?.searchText !== undefined &&
              (completeRowStr.toLowerCase().includes(searchFilter?.searchText.toLowerCase()) ||
                currentLevel < (searchFilter?.searchLevel ?? 0))));
        if (doShowFilterMatchAndParentNodes) {
          console.log(completeRowStr);
        }
        // Recursively traverse the child object
        if (hasChildren) {
          printXMLTree(obj[key], searchFilter, currentLevel + 1);
        }
      }
    }
  }
}

// xbrli:stringItemType -> string
const readableSubstitutionGroup = (obj: any): string =>
  obj.substitutionGroup.split(':')[1]?.replace('Item', '').replace('hypercube', 'table');
const readableType = (obj: any): string =>
  obj.type
    ? [(readableSubstitutionGroup(obj), obj.type.split(':')[1]?.replace('ItemType', ''))].join(':').replace('item:', '')
    : '';
const emojiForField = (obj: any): string => {
  if (obj.type.includes('table')) {
    return '📊';
  } else if (obj.type.includes('string')) {
    return '🔤';
  } else if (obj.type.includes('textBlock')) {
    return '📝';
  } else if (obj.type.includes('enumerationSet')) {
    return '⬇️';
  } else if (obj.type.includes('monetary')) {
    return '💰';
  } else if (obj.type.includes('percent')) {
    return '%';
  } else if (obj.type.includes('date')) {
    return '📅';
  } else if (obj.type.includes('ghgEmissions')) {
    return '💭';
  } else if (obj.type.includes('boolean')) {
    return '✅';
  } else {
    return '❓';
  }
};
const formatInputField = (obj: any): string =>
  obj.type ? `${emojiForField(obj)} ${obj.label} [${readableSubstitutionGroup(obj)} ${readableType(obj)}]` : obj.label;

export function printInputFormTree(obj: any, searchFilter?: TreeSearchFilter, currentLevel: number = 0): void {
  const ALLOWED_KEYS = ['sectionCode', 'label', 'children'];
  const indentStr = currentLevel > 0 ? `${'  '.repeat(currentLevel)}∟ ` : '';
  for (const key in obj) {
    // Only print the ALLOWED_KEYS and array children
    if (obj.hasOwnProperty(key) && (ALLOWED_KEYS.includes(key) || !isNaN(Number(key)))) {
      switch (key) {
        case 'sectionCode':
          if (currentLevel === 1) console.log(`${obj[key]}`);
          break;
        case 'label':
          console.log(`${indentStr}${formatInputField(obj)}`);
          break;
      }
      // Recursively traverse the child object
      const hasChildren = typeof obj[key] === 'object' && obj[key] !== null;
      if (hasChildren) {
        printInputFormTree(obj[key], searchFilter, currentLevel + 1);
      }
    }
  }
}
