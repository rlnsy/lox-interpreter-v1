export function asNotUndefined<T>(value: T | undefined): T {
  return value as T;
}
