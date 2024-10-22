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
