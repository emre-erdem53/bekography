/**
 * Admin formlarındaki TL tutarları (tam sayı).
 * iOS Safari TR'de type="number" değeri "78.000" gösterebilir;
 * Number("78.000") === 78 olduğu için binlik ayracı/virgül güvenli parse edilir.
 */
export function parseMoneyInput(raw: string): number {
  const trimmed = raw.trim().replace(/\s/g, "").replace(/₺/g, "");
  if (!trimmed) return 0;

  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");

  let normalized = trimmed;

  if (hasComma && hasDot) {
    // 1.234,56 (TR) veya 1,234.56 (US)
    const lastComma = trimmed.lastIndexOf(",");
    const lastDot = trimmed.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = trimmed.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = trimmed.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = trimmed.split(",");
    // 73,4 → ondalık; 73,400 → binlik (3 hane)
    if (parts.length === 2 && parts[1].length === 3 && /^\d+$/.test(parts[1])) {
      normalized = trimmed.replace(/,/g, "");
    } else {
      normalized = trimmed.replace(",", ".");
    }
  } else if (hasDot) {
    const parts = trimmed.split(".");
    if (parts.length > 2) {
      normalized = trimmed.replace(/\./g, "");
    } else if (
      parts.length === 2 &&
      parts[1].length === 3 &&
      /^\d+$/.test(parts[1])
    ) {
      // 78.000 → binlik
      normalized = trimmed.replace(/\./g, "");
    }
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

/** Kontrol değerinde binlik ayracı yok — mobil klavye karışıklığını önler. */
export function formatMoneyInputValue(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "";
  return String(Math.round(amount));
}
