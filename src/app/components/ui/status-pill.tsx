import React from 'react';
import { cn } from './utils';

type StatusTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

const toneClass: Record<StatusTone, string> = {
  default: 'border border-[rgba(224,192,177,0.18)] bg-[#f2f4f6] text-[#455f87]',
  info: 'border border-[rgba(69,95,135,0.14)] bg-[#eef3f8] text-[#455f87]',
  success: 'border border-[rgba(72,160,111,0.18)] bg-[#edf7f1] text-[#2f6f47]',
  warning: 'border border-[rgba(197,122,24,0.18)] bg-[#fff1e7] text-[#9d4300]',
  danger: 'border border-[rgba(194,76,48,0.18)] bg-[#fff0ec] text-[#b9381c]',
};

export function StatusPill({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-none px-2.5 py-1 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
        toneClass[tone],
        className,
      )}
      style={{ fontFamily: 'Inter, var(--font-body), sans-serif' }}
    >
      {children}
    </span>
  );
}
