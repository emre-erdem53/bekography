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
  className = "",
}: StatusSelectProps<T> & { className?: string }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as T)}
      className={`w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white outline-none focus:border-white/30 disabled:opacity-50 sm:w-auto sm:py-1.5 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
