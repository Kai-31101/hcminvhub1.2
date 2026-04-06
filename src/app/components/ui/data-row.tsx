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
      className={cn(
        'flex items-center justify-between gap-4 rounded-none border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#fbfcfd]',
        className,
      )}
      style={{ borderColor: 'rgba(224, 192, 177, 0.18)', fontFamily: 'Inter, var(--font-body), sans-serif' }}
      {...props}
    >
      {children}
    </div>
  );
}
