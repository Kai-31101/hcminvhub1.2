import React from 'react';
import { cn } from './utils';

type StatusTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

const toneClass: Record<StatusTone, string> = {
  default: 'bg-slate-100 text-slate-700',
  info: 'bg-sky-100 text-sky-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
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
    <span className={cn('inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold', toneClass[tone], className)}>
      {children}
    </span>
  );
}
