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

export function formatCoupleFirstNames(
  brideFirstName: string | null | undefined,
  brideName: string,
  groomFirstName: string | null | undefined,
  groomName: string,
): string {
  return formatCoupleName(
    resolvePersonFirstName(brideFirstName, brideName),
    resolvePersonFirstName(groomFirstName, groomName),
  );
}

export function joinPersonName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function splitPersonName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function resolvePersonFirstName(
  firstName: string | null | undefined,
  fullName: string,
): string {
  const trimmed = firstName?.trim();
  if (trimmed) return trimmed;
  return splitPersonName(fullName).firstName;
}

export function parseRequestCustomerName(customerName: string): {
  firstName: string;
  lastName: string;
  role: "gelin" | "damat" | null;
} {
  const roleMatch = customerName.match(/\((Gelin|Damat)\)\s*$/);
  const role =
    roleMatch?.[1] === "Gelin"
      ? "gelin"
      : roleMatch?.[1] === "Damat"
        ? "damat"
        : null;
  const namePart = customerName.replace(/\s*\((Gelin|Damat)\)\s*$/, "").trim();
  const { firstName, lastName } = splitPersonName(namePart);
  return { firstName, lastName, role };
}

export function reservationNameFieldsFromInput(input: {
  brideFirstName: string;
  brideLastName: string;
  groomFirstName: string;
  groomLastName: string;
}) {
  const brideFirstName = input.brideFirstName.trim();
  const brideLastName = input.brideLastName.trim();
  const groomFirstName = input.groomFirstName.trim();
  const groomLastName = input.groomLastName.trim();

  return {
    brideFirstName,
    brideLastName,
    groomFirstName,
    groomLastName,
    brideName: joinPersonName(brideFirstName, brideLastName),
    groomName: joinPersonName(groomFirstName, groomLastName),
  };
}

export function normalizeTcKimlik(value: string) {
  return value.replace(/\D/g, "");
}

/** Türkiye cep telefonu: 0530 171 42 22 */
export function formatTurkishPhone(value: string): string {
  const digits = normalizeTcKimlik(value);
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 10) {
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  const trimmed = value.trim();
  return trimmed || "—";
}

export function formatPersonDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name.trim() || "—";
  const [first, ...rest] = parts;
  return `${first} ${rest.join(" ").toLocaleUpperCase("tr")}`;
}

export function firstNameFromFullName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name.trim();
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
