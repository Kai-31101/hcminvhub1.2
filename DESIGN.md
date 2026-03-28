# HCM Investment Hub Design System

This file is the canonical implementation reference derived from `HCMInvestmentHub-refined.md`.

## Fonts

- Headings: `Be Vietnam Pro`
- Body/UI: `IBM Plex Sans`
- Mono: `IBM Plex Mono`

## Core Tokens

- Primary: `#0C2D4A`, `#0C4A6E`, `#0369A1`, `#E0F2FE`
- Accent: `#059669`, `#10B981`, `#D1FAE5`
- Semantic: warning `#F59E0B`, danger `#EF4444`, success `#10B981`, info `#0369A1`
- Neutrals: `#111827`, `#374151`, `#6B7280`, `#E5E7EB`, `#F9FAFB`

## Layout Rules

- Government operator screens are data-dense App UI, not marketing cards.
- Public explorer/detail screens are hybrid trust surfaces with action-first hierarchy.
- Decorative purple/indigo gradients are prohibited.
- Cards are only used when the card is the interaction.

## Shared Components

- `StatusPill`: small semantic status chip
- `UrgencyBadge`: days-in-stage / days-to-deadline indicator
- `CompletionMeter`: horizontal completeness bar
- `DataRow`: dense clickable list row

## Implementation Notes

- Use CSS custom properties from `src/styles/theme.css`
- Apply `font-heading` to page titles and hero titles
- Apply `font-body` to tables, filters, and metadata
- Prefer list rows over decorative card grids for operational screens
