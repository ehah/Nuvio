# Overlay picker sync (v0.3)

When a host element uses Tailwind variants (`dark:`, opacity modifiers), the Editor must still show the **effective** values in:

- Typography controls (font size, weight, line height, letter spacing, text align, text color)
- Spacing controls (background, padding, margin, gap, etc.)
- Color picker swatches (text/background)

## Required behavior

1. Parse `element.className` tokens (not only allowlisted utilities).
2. Resolve `dark:` variants for display (light mode assumption for editor preview).
3. Resolve opacity modifiers like `bg-white/50` and `bg-white/[0.03]`.
4. Show current values in selects (not `—`) even when utilities are outside static allowlists.
5. Color picker swatch reflects the resolved color for the selected utility.

## Implementation

- `packages/overlay/src/tailwind-token-read.ts` — responsive + `dark:` flattening
- `packages/overlay/src/read-alpha-picks.ts` — pattern-based reads + `activeBreakpoint`
- `packages/overlay/src/ColorPickerRow.tsx` — swatch/palette for opacity utilities
- `packages/overlay/src/PropertyPanelShell.tsx` — sync picks at active breakpoint; show unknown tokens in selects

**Tip:** If a utility is only on `xl:` (e.g. `xl:bg-red-100`), set **Active BP** to `xl` so the Editor shows that value.
