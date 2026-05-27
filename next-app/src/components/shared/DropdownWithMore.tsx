"use client";

type DropdownWithMoreProps = {
  value: string;
  customValue: string;
  onChange: (value: string) => void;
  onCustomValueChange: (value: string) => void;
  options: string[];
  className?: string;
  selectPlaceholder?: string;
  customPlaceholder?: string;
  helperText?: string;
};

export default function DropdownWithMore({
  value,
  customValue,
  onChange,
  onCustomValueChange,
  options,
  className = "",
  selectPlaceholder = "Select an option",
  customPlaceholder = "Type your custom value",
  helperText = "Choose More... to type a custom value.",
}: DropdownWithMoreProps) {
  const isCustom = value === "__more__";

  return (
    <div className="space-y-2">
      <select value={isCustom ? "__more__" : value} onChange={(e) => onChange(e.target.value)} className={className}>
        <option value="">{selectPlaceholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="__more__">More...</option>
      </select>
      {isCustom ? (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomValueChange(e.target.value)}
          className={className}
          placeholder={customPlaceholder}
        />
      ) : null}
      <p className="text-xs text-slate-400">{helperText}</p>
    </div>
  );
}