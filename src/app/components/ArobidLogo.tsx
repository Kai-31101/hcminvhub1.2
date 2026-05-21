import React from 'react';

export function ArobidLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/figma-homepage/arobid-logo.svg"
      className={className}
      alt="arobid.com - A Road to Big Deals"
    />
  );
}
