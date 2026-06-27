import { parseDateOnlyInput } from "@/lib/date-only";

export const CANCELLATION_POLICY =
  "30 günden fazla süre kalan bir çekimi iptal eden taraf karşı tarafa toplam ücretin %50'sini cayma bedeli olarak öder. 30 günden daha az bir süre varsa bu oran %75'tir. Sözleşmedeki mücbir sebeplerle iptal olursa oran %25'tir.";

const CANCELLATION_FEE_THRESHOLD_DAYS = 30;
const RATE_BEYOND_THRESHOLD = 0.5;
const RATE_WITHIN_THRESHOLD = 0.75;

export function getEarliestShootDateInput(
  shootDates: Array<string | null | undefined>,
): string | null {
  const valid = shootDates.filter((date): date is string => Boolean(date));
  if (valid.length === 0) return null;
  return valid.sort()[0];
}

export function resolveCancellationFeeRate(
  shootDateInput: string | null | undefined,
  referenceDate: Date = new Date(),
): number {
  if (!shootDateInput) {
    return RATE_WITHIN_THRESHOLD;
  }

  const shootDate = parseDateOnlyInput(shootDateInput);
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  shootDate.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = Math.ceil((shootDate.getTime() - ref.getTime()) / msPerDay);

  if (daysUntil > CANCELLATION_FEE_THRESHOLD_DAYS) {
    return RATE_BEYOND_THRESHOLD;
  }

  return RATE_WITHIN_THRESHOLD;
}

export function calculateCancellationFeeMax(
  totalPrice: number,
  shootDateInput?: string | null,
  referenceDate?: Date,
): number {
  const safeTotal = Math.max(0, Math.round(totalPrice));
  if (safeTotal === 0) return 0;

  const rate = resolveCancellationFeeRate(shootDateInput, referenceDate);
  return Math.round(safeTotal * rate);
}

export function describeCancellationFeeRate(rate: number): string {
  const percent = Math.round(rate * 100);
  if (rate === RATE_BEYOND_THRESHOLD) {
    return `%${percent} (çekime 30 günden fazla var)`;
  }
  if (rate === RATE_WITHIN_THRESHOLD) {
    return `%${percent} (çekime 30 gün veya daha az var)`;
  }
  return `%${percent}`;
}
