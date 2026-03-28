import React from 'react';
import { cn } from './utils';

export function CompletionMeter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor = clamped >= 80 ? 'bg-emerald-500' : clamped >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${clamped}%` }} />
      </div>
      <div className="text-xs font-medium text-slate-600">{clamped}% complete</div>
    </div>
  );
}
