/**
 * We need to map a JavaScript value representation of a lox value
 * into a string which reflects the lox value
 */
export function stringify(value: lox.Value): string {
  if (value == null) {
    return "nil";
  }
  return `${value}`;
}
