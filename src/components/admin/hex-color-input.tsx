"use client";

import { normalizeHexColor } from "@/lib/color-utils";

type HexColorInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function HexColorInput({
  value,
  onChange,
  placeholder = "#ff9a5e",
}: HexColorInputProps) {
  const normalized = normalizeHexColor(value);
  const previewColor = normalized ?? "#333333";

  function handleBlur() {
    const next = normalizeHexColor(value);
    if (next) onChange(next);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        spellCheck={false}
        className="w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-white/30"
      />
      <span
        className="h-11 w-11 shrink-0 rounded-xl border border-white/10"
        style={{ backgroundColor: previewColor }}
        aria-hidden
      />
    </div>
  );
}
