// applyToAll(func, obj1) or applyToAll(func, [obj1, obj2, ...])
export function applyToAll<T1, T2>(func: (item: T1) => T2, objectOrArray: T1 | T1[]): T2 | T2[] {
  return Array.isArray(objectOrArray) ? objectOrArray.map(func) : func(objectOrArray);
}
