import { ATTRIBUTES_KEY } from './parsing';

interface TreeSearchFilter {
  maxLevel?: number;
  level?: number;
  text?: string;
}

export function printObjectTree(obj: any, searchFilter: TreeSearchFilter, currentLevel: number = 0): void {
  const indent = '  '.repeat(currentLevel); // Indentation based on depth
  // Don't traverse below the maxLevel
  if (searchFilter?.maxLevel !== undefined && currentLevel >= searchFilter?.maxLevel) {
    return;
  }
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Don't traverse the attributes ($) object
      if (key !== ATTRIBUTES_KEY) {
        const hasChildren = typeof obj[key] === 'object' && obj[key] !== null;
        const attributesObject = hasChildren ? obj[key][ATTRIBUTES_KEY] : undefined;
        const idStr = attributesObject?.id !== undefined ? `id:'${attributesObject.id}'` : '';
        // const nameStr = attributesObject?.name !== undefined ? `name:'${attributesObject.name}'` : ''; // name is too similar to id, and id is more common
        const typeStr = attributesObject?.type !== undefined ? `type:'${attributesObject.type}'` : '';
        const attributesArray = [
          ...(idStr !== '' ? [idStr] : []),
          ...(typeStr !== '' ? [typeStr] : []),
          ...Object.keys(attributesObject ?? {}).filter((key) => !['id', 'type'].includes(key))
        ];
        const attributesStr = attributesObject !== undefined ? ` [${attributesArray.join(', ')}]` : '';
        const doShowFilterMatchAndParentNodes =
          searchFilter?.text === undefined ||
          (searchFilter?.text !== undefined &&
            (idStr.toLowerCase().includes(searchFilter.text.toLowerCase()) ||
              currentLevel < (searchFilter.level ?? 0)));
        if (doShowFilterMatchAndParentNodes) {
          console.log(`${indent} ∟ ${key}` + attributesStr);
        }
        // Recursively traverse the child object
        if (hasChildren) {
          printObjectTree(obj[key], searchFilter, currentLevel + 1);
        }
      }
    }
  }
}
