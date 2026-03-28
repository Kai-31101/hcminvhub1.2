import React from 'react';
import { cn } from './utils';

function getUrgencyTone(days: number) {
  if (days > 14) return 'bg-emerald-100 text-emerald-800';
  if (days >= 7) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

export function UrgencyBadge({
  days,
  label,
  className,
}: {
  days: number;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold', getUrgencyTone(days), className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? `${days} days`}
    </span>
  );
}
