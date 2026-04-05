import React from 'react';

export function SeeAllButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-center pt-4">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        {label}
      </button>
    </div>
  );
}
