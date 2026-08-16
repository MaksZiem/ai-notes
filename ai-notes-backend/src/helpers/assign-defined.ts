/**
 * Like Object.assign, but skips keys whose value is `undefined` instead of
 * overwriting the target with them. Needed because optional DTO fields
 * (declared as class fields under `useDefineForClassFields`, implied by the
 * ES2023 build target) exist as own properties set to `undefined` even when
 * the client omits them from the request body — a plain Object.assign would
 * null out every column not included in a partial PATCH.
 */
export function assignDefined<T extends object>(target: T, source: Partial<T>): T {
  for (const key of Object.keys(source) as (keyof T)[]) {
    if (source[key] !== undefined) {
      target[key] = source[key] as T[keyof T];
    }
  }
  return target;
}
