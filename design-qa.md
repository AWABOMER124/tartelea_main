# Design QA — Tartelea reference system

## Evidence

- Source reference: `C:/Users/DELL/Downloads/صورة Codex 21 سبتمبر 2026، 09_15_06 م.png`
- Implementation capture URL: `http://127.0.0.1:8080/`
- Implementation detail capture URL: `http://127.0.0.1:8080/library`
- Desktop viewport: Codex in-app browser default viewport (`1265 × 710` CSS px in the captured comparison), default device density.
- Mobile viewport: `390 × 844` CSS px, default device density.
- State: light theme; signed-out home; library empty state; RTL Arabic.

## Reference traits checked

- Exact core palette: Earth Brown `#4A2C1D`, Muted Gold `#C89B3C`, Spiritual Green `#456B57`, Red `#D64545`, Dark Gray `#1F1F1F`, Gray `#6B625C`, Ivory `#F7F5F1`, White `#FFFFFF`.
- Cairo is the interface typeface; Amiri is reserved for Quranic text.
- White compact cards on an ivory canvas, subtle borders/shadows, restrained corner radius.
- Desktop navigation uses a persistent left sidebar and compact top search/actions bar.
- Mobile navigation uses the five-item bottom bar; the desktop sidebar is removed.
- Existing Tartelea logo asset remains unchanged.

## Comparison history

### Iteration 1

- Desktop matched the reference structure and hierarchy, but the home and discovery cards retained larger legacy radii.
- Mobile discovery filters fitted the viewport but exposed a visible horizontal scrollbar.
- Adjustments: reduced shared and home card radii, moved Quranic copy to Amiri, hid the filter scrollbar while preserving touch scrolling, and aligned the native status-bar color with the ivory token.

### Final comparison

- Structure: desktop sidebar, top utility bar, compact content canvas, and mobile bottom navigation match the reference direction.
- Styling: palette, card hierarchy, inputs, primary/secondary/outline buttons, icon containers, borders, and shadow restraint are consistent with the reference.
- Responsive: no horizontal page overflow at `390 × 844`; long filter sets scroll within their own row; primary actions remain reachable; bottom navigation labels remain legible.
- Accessibility: visible focus rings, semantic navigation labels, `aria-current`, minimum 40–44 px control heights, reduced-motion support, and RTL order remain intact.
- Content fidelity: screens use existing application data and real empty/loading states; no reference-image content was introduced as fake product data.

## Final result

passed
