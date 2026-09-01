const HEX_SHORT = /^#([0-9a-fA-F]{3})$/;
const HEX_FULL = /^#([0-9a-fA-F]{6})$/;
const RGB =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/;

function channelToHex(channel: number) {
  return Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();

  const shortMatch = trimmed.match(HEX_SHORT);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const fullMatch = trimmed.match(HEX_FULL);
  if (fullMatch) {
    return `#${fullMatch[1].toLowerCase()}`;
  }

  const rgbMatch = trimmed.match(RGB);
  if (rgbMatch) {
    return rgbToHex(
      Number(rgbMatch[1]),
      Number(rgbMatch[2]),
      Number(rgbMatch[3]),
    );
  }

  return null;
}

export function isValidHexColor(value: string) {
  return normalizeHexColor(value) !== null;
}

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function mixChannel(from: number, to: number, amount: number) {
  return Math.round(from + (to - from) * amount);
}

/** amount: 0 = base, 1 = target. */
export function mixHexColors(base: string, target: string, amount: number) {
  const a = parseHexRgb(base);
  const b = parseHexRgb(target);
  if (!a || !b) return normalizeHexColor(base) ?? base;
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    mixChannel(a.r, b.r, t),
    mixChannel(a.g, b.g, t),
    mixChannel(a.b, b.b, t),
  );
}

/**
 * Hizmet alanı accent'inden açık→koyu paket tonları.
 * İlk paket daha açık, son paket hafif koyu (çok koyuya inmez).
 */
export function nestedPackageAccentTone(
  baseAccent: string,
  index: number,
  count: number,
) {
  const base = normalizeHexColor(baseAccent) ?? baseAccent;
  if (count <= 1) return base;

  const t = index / (count - 1); // 0..1
  // Açık: beyaza %32, koyu: siyaha %18 — orta ton ≈ base
  if (t <= 0.5) {
    const lighten = (1 - t * 2) * 0.32;
    return mixHexColors(base, "#ffffff", lighten);
  }
  const darken = (t - 0.5) * 2 * 0.18;
  return mixHexColors(base, "#000000", darken);
}
