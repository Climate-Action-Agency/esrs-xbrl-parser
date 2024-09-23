import { ATTRIBUTES_KEY } from './parsing';

export function printObjectTree(obj: any, maxLevels: number = -1, skipKeys: string[] = [], level: number = 0): void {
  const indent = '  '.repeat(level); // Indentation based on depth
  if (maxLevels !== -1 && level >= maxLevels) {
    return;
  }
  for (const key in obj) {
    if (skipKeys.includes(key)) {
      continue;
    }
    if (obj.hasOwnProperty(key)) {
      console.log(`${indent} ∟ ${key}`);
      // If the value is another object, recursively print its keys
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        printObjectTree(obj[key], maxLevels, skipKeys, level + 1);
      }
    }
  }
}

interface TreeSearchFilter {
  maxLevel?: number;
  level?: number;
  text?: string;
}

export function printXMLTree(obj: any, searchFilter: TreeSearchFilter, currentLevel: number = 0): void {
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
        const idStr = attributesObject?.id !== undefined ? `id:'${attributesObject.id}'` : '';
        const ATTRIBUTES_TO_SHOW_VALUE = ['id', 'type', 'xlink:title', 'xlink:href'];
        const attributesWithValue = Object.keys(attributesObject ?? {})
          .filter((key) => ATTRIBUTES_TO_SHOW_VALUE.includes(key))
          .map((key) => `${key}:'${attributesObject[key]}'`);
        const attributesArray = [
          ...attributesWithValue,
          ...Object.keys(attributesObject ?? {}).filter((key) => !ATTRIBUTES_TO_SHOW_VALUE.includes(key))
        ];
        const attributesStr = attributesObject !== undefined ? ` [${attributesArray.join(', ')}]` : '';
        const textChildStr = isTextNode ? `: "${obj[key]}"` : '';
        const doShowFilterMatchAndParentNodes =
          searchFilter?.text === undefined ||
          (searchFilter?.text !== undefined &&
            (idStr.toLowerCase().includes(searchFilter.text.toLowerCase()) ||
              currentLevel < (searchFilter.level ?? 0)));
        if (doShowFilterMatchAndParentNodes) {
          console.log(indentStr + key + attributesStr + textChildStr);
        }
        // Recursively traverse the child object
        if (hasChildren) {
          printXMLTree(obj[key], searchFilter, currentLevel + 1);
        }
      }
    }
  }
}

export function printHierarchyTree(obj: any, searchFilter: TreeSearchFilter, currentLevel: number = 0): void {
  const indent = '  '.repeat(currentLevel);
  // Stop recursion if the maxLevel is reached
  if (searchFilter.maxLevel !== undefined && currentLevel >= searchFilter.maxLevel) {
    return;
  }
  // Filter by text if the filter is applied
  if (searchFilter.text && obj?.label && !obj.label.includes(searchFilter.text)) {
    return;
  }
  // Print the current node with its ID and label
  const label = obj?.label;
  const id = obj?.id?.split('#')?.[1];
  if (id !== undefined) {
    console.log(`${indent} ∟ ${id}: “${label}”`);
  }
  const children = obj?.children ?? Object.values(obj) ?? [];
  // Recurse for each child node
  if (children && children.length > 0) {
    children.forEach((child: any) => {
      printHierarchyTree(child, searchFilter, currentLevel + 1);
    });
  }
}
