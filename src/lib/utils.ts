// applyToAll(obj1, func) or applyToAll([obj1, obj2, ...], func)
export function applyToAll<T1, T2>(objectOrArray: T1 | T1[], func: (item: T1) => T2): T2 | T2[] {
  return Array.isArray(objectOrArray) ? objectOrArray.map(func) : func(objectOrArray);
}
