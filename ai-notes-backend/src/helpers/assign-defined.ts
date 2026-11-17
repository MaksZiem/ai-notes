export function assignDefined<T extends object>(target: T, source: Partial<T>): T {
  for (const key of Object.keys(source) as (keyof T)[]) {
    if (source[key] !== undefined) {
      target[key] = source[key] as T[keyof T];
    }
  }
  return target;
}
