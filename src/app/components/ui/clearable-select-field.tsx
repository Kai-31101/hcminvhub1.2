import React from 'react';
import { X } from 'lucide-react';
import { cn } from './utils';

type ClearableSelectOption = {
  label: string;
  value: string;
};

type ClearableSelectFieldProps = {
  ariaLabel?: string;
  className?: string;
  options: ClearableSelectOption[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function ClearableSelectField({
  ariaLabel,
  className,
  options,
  placeholder,
  value,
  onChange,
}: ClearableSelectFieldProps) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel ?? placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn('w-full pr-12', className)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#8b97a8] transition-colors hover:bg-[#e9eef3] hover:text-[#1f2937]"
          aria-label="Clear selection"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
