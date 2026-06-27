"use client";

import { enforcePersonNamePartInput } from "@/lib/person-name-input";

type PersonNameInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
};

export function PersonNameInput({
  value,
  onChange,
  required,
  className,
  placeholder,
  autoComplete,
}: PersonNameInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) =>
        onChange(enforcePersonNamePartInput(event.target.value))
      }
      onBlur={(event) =>
        onChange(enforcePersonNamePartInput(event.target.value.trim()))
      }
      required={required}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={className}
    />
  );
}
