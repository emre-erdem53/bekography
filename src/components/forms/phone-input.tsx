"use client";

import {
  formatTurkishMobileInput,
  isValidTurkishMobilePhone,
  sanitizeTurkishMobileInput,
} from "@/lib/phone-utils";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
  showHint?: boolean;
};

export function PhoneInput({
  value,
  onChange,
  required,
  className,
  id,
  showHint = true,
}: PhoneInputProps) {
  const displayValue = formatTurkishMobileInput(value);
  const isInvalid = value.length > 0 && !isValidTurkishMobilePhone(value);

  return (
    <div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={displayValue}
        onChange={(event) =>
          onChange(sanitizeTurkishMobileInput(event.target.value))
        }
        onPaste={(event) => {
          event.preventDefault();
          onChange(sanitizeTurkishMobileInput(event.clipboardData.getData("text")));
        }}
        required={required}
        placeholder="5XX XXX XX XX"
        maxLength={13}
        aria-invalid={isInvalid}
        className={className}
      />
      {showHint && isInvalid ? (
        <p className="mt-1 text-xs text-amber-400">
          10 haneli cep telefonu girin (5 ile başlamalı)
        </p>
      ) : null}
    </div>
  );
}
