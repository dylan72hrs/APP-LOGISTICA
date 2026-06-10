const EXCEL_FORMULA_PREFIX_PATTERN = /^[=+\-@]/;

export function sanitizeExcelCell(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const firstVisibleCharacter = value.trimStart().charAt(0);
  if (!EXCEL_FORMULA_PREFIX_PATTERN.test(firstVisibleCharacter)) return value;

  return `'${value}`;
}

export function sanitizeExcelRow<T extends unknown[]>(row: T): T {
  return row.map(sanitizeExcelCell) as T;
}

export function sanitizeExcelString(value: unknown): string {
  return String(sanitizeExcelCell(String(value ?? '')));
}
