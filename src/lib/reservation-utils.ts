export function getTrackingUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/takip/${slug}`;
}

export function formatCoupleName(brideName: string, groomName: string) {
  const bride = brideName.trim();
  const groom = groomName.trim();
  if (bride && groom) return `${bride} & ${groom}`;
  return bride || groom || "Rezervasyon";
}

export function normalizeTcKimlik(value: string) {
  return value.replace(/\D/g, "");
}

export function reservationTcMatches(
  inputTc: string,
  brideTc: string,
  groomTc: string,
) {
  const normalized = normalizeTcKimlik(inputTc);
  if (normalized.length !== 11) return false;

  const bride = normalizeTcKimlik(brideTc);
  const groom = normalizeTcKimlik(groomTc);
  if (!bride && !groom) return false;

  return normalized === bride || normalized === groom;
}
