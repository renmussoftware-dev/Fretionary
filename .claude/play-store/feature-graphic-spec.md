# Feature graphic — design spec

Required by Play Store. Goes at the top of your listing, above the screenshots.
Also used in promotional surfaces (search results, recommendations).

## Specs

- **Dimensions**: 1024 × 500 pixels (no flex — exact)
- **Format**: JPEG or 24-bit PNG (no alpha)
- **Max file size**: 1 MB
- **No text near edges**: Play Store may crop slightly on different surfaces

## Design direction (matching Obsidian theme)

**Background**
- Base: `#0A0A0C` (Obsidian bg)
- Subtle radial gradient from `#16161B` at top-left to `#0A0A0C` at bottom-right
  (matches the in-app `bgGrad` token)

**Hero text** — placed left half, vertically centered
- Wordmark: **Fretionary**
  - Font: Inter Bold or system-default bold sans
  - Size: ~110pt
  - Color: `#F2F1EC` (warm white text)
  - Letter-spacing: -1
- Tagline below: **The fretboard dictionary**
  - Font: JetBrains Mono Medium (matches in-app eyebrow style)
  - Size: ~32pt, all caps, letter-spacing: 3
  - Color: `#6E60D9` (brand indigo) at 80% opacity

**Visual element** — placed right half
- Partial fretboard rendering: 4–5 frets, 6 strings, with a few colored note
  dots lit up (yellow root, red 3rd, green 5th, blue 7th) to show off the
  interval color system at a glance
- Could also be a stylized version of the app icon (the existing
  `assets/icon.png`) at large size with a soft glow
- Either way: keep it dark, premium, low-contrast — the warmth of the warm
  white text + indigo accent against deep near-black should feel like a
  high-end audio product, not a mass-market app

**Avoid**
- Cliché stock guitar imagery
- Loud gradients or bright primary colors
- Text smaller than ~24pt (won't read in thumbnail crops)
- Anything near the corners — Play Store crops the top + bottom edges on some surfaces

## Tools

- **Figma** (free) — easiest if you already have an account. Set frame to 1024×500.
- **Canva** — has Play Store templates, but the templated feel may clash with the premium direction.
- **Photoshop / Affinity Photo** — full control, fine.
- **Quick option**: take a high-res Pixel screenshot of the Fretboard tab in
  scales mode, dim the brightness in an editor, overlay the wordmark + tagline
  in the left half. Less elegant but ships in 10 minutes.

## Quick text I'd use

```
Fretionary
THE FRETBOARD DICTIONARY
```

(That's it — short and confident. The screenshots below the feature graphic do
the rest of the selling.)

## Optional second variant

If you want a "Pro" version once the app is live and reviewed:
- Same composition
- Add small badge: **Editor's Pick** / star rating / "X+ downloads" after
  the listing has traction
