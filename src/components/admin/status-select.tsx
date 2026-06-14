"use client";

type StatusSelectProps<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function StatusSelect<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: StatusSelectProps<T>) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as T)}
      className="rounded-lg border border-white/10 bg-[#141414] px-3 py-1.5 text-sm text-white outline-none focus:border-white/30 disabled:opacity-50"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
