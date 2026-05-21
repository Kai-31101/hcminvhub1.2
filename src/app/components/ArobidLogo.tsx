import React from 'react';

export function ArobidLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 94"
      role="img"
      aria-label="arobid.com - A Road to Big Deals"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 70 38 0l40 70H0Z" fill="#f56600" />
      <path d="M10 63 28 39l15 17L70 15 42 70 28 52 10 63Z" fill="#fff" />
      <text
        x="88"
        y="54"
        fill="#020617"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="44"
        fontWeight="800"
        letterSpacing="-2"
      >
        arobid.com
      </text>
      <text
        x="139"
        y="84"
        fill="#020617"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="22"
        fontWeight="700"
      >
        A Road to Big Deals
      </text>
    </svg>
  );
}
