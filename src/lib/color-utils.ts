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
