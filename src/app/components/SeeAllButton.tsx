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
        className="inline-flex h-11 items-center justify-center rounded-[4px] bg-[linear-gradient(22.81deg,#9D4300_0%,#F97316_100%)] px-6 text-[14px] font-bold text-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] transition-opacity hover:opacity-95"
      >
        {label}
      </button>
    </div>
  );
}
