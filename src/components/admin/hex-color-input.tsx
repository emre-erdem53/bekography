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

  function handlePickerChange(nextColor: string) {
    onChange(nextColor.toLowerCase());
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
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-white/30"
      />
      <label
        className="relative flex h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/20 shadow-inner transition hover:border-white/40"
        title="Renk seç"
      >
        <input
          type="color"
          value={previewColor}
          onChange={(event) => handlePickerChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0 opacity-0"
          aria-label="Renk seç"
        />
        <span
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: previewColor }}
          aria-hidden
        />
      </label>
    </div>
  );
}
