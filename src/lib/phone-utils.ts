/** Strip formatting; keep up to 10 mobile digits (5XXXXXXXXX). */
export function sanitizeTurkishMobileInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("90") && digits.length > 10) {
    digits = digits.slice(2);
  }

  while (digits.startsWith("0") && digits.length > 0) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length > 0 && digits[0] !== "5") {
    return "";
  }

  return digits;
}

export function isValidTurkishMobilePhone(value: string): boolean {
  const digits = sanitizeTurkishMobileInput(value);
  return digits.length === 10 && digits.startsWith("5");
}

export function normalizeTurkishMobileForStorage(value: string): string {
  return sanitizeTurkishMobileInput(value);
}

/** Input display: 5XX XXX XX XX */
export function formatTurkishMobileInput(value: string): string {
  const digits = sanitizeTurkishMobileInput(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
}
