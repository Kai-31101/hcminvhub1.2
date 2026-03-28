import React from 'react';
import { cn } from './utils';

export function DataRow({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-slate-50', className)}
      {...props}
    >
      {children}
    </div>
  );
}
