"use client";

import type { InputHTMLAttributes } from "react";

type StrictNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "inputMode" | "pattern"
> & {
  value: string;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
  helperText?: string;
};

function sanitizeNumberInput(value: string, allowDecimal: boolean) {
  if (!allowDecimal) return value.replace(/\D/g, "");

  const cleaned = value.replace(/[^\d.]/g, "");
  const [wholePart, ...fractionParts] = cleaned.split(".");
  if (!fractionParts.length) return wholePart;
  return `${wholePart}.${fractionParts.join("").replace(/\./g, "")}`;
}

export default function StrictNumberInput({
  value,
  onChange,
  allowDecimal = false,
  helperText = "Numbers only.",
  className = "",
  ...props
}: StrictNumberInputProps) {
  return (
    <div>
      <input
        {...props}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*"}
        value={value}
        onChange={(e) => onChange(sanitizeNumberInput(e.target.value, allowDecimal))}
        className={className}
      />
      <p className="mt-1 text-xs text-slate-400">{helperText}</p>
    </div>
  );
}