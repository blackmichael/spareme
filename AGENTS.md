# Brand Management

The logo has one source of truth: `src/brand/logo.json`.

## Source Of Truth

`src/brand/logo.json` owns:

- The `spare me` text and Space Grotesk typography settings
- Pin body and stripe path data
- Pin stroke styles, viewport, rotation, and proportions
- Wordmark tracking and spacing
- Light and dark logo colors
- Favicon optical sizing
- OG image dimensions and logo scale

Do not duplicate these values in React components, CSS, scripts, or hand-maintained public assets.

## Canonical Vector Model

`scripts/generate-brand-assets.mjs` loads `logo.json` and the project's Space Grotesk font through `fontkit`. It shapes the wordmark, converts every glyph to an SVG path, and calculates one canonical coordinate system for the words and pin.

The generator writes the application model to:

- `src/brand/generated-logo.json`
- `src/brand/generated-logo.css`

`src/brand/Wordmark.tsx` renders those exact glyph paths and the canonical pin viewport. Header and footer differences are scale-only, so they preserve the same geometry. The generated CSS supplies theme-aware colors from `logo.json`.

Do not hand-edit either generated application file.

## Generated Assets

Run `npm run generate:brand` after changing `logo.json`. The same canonical model generates:

- `public/favicon.svg`
- `public/favicon-32.png`
- `public/apple-touch-icon.png`
- `public/og-image.svg`
- `public/og-image.png`

The favicon uses the canonical pin renderer, including its viewBox and stripe clip, with explicit small-icon sizing from `logo.json`. The OG image centers and scales the same complete vector model used by React. `@resvg/resvg-js` rasterizes PNG output without relying on installed system fonts.

Generated SVG files necessarily contain expanded copies of the canonical paths. They are build output, not additional sources of truth. Do not hand-edit files in `public/`.

Rotation is applied exactly once on a parent `<g>` in parent coordinates. Never put a transform on the nested pin `<svg>`; SVG renderers do not handle that consistently.

## Lifecycle

- `npm run dev` generates assets before Vite starts.
- Vite regenerates assets and reloads when `logo.json` changes during development.
- `npm run build` generates assets before TypeScript and Vite compilation.
- Tests and typecheck run `npm run generate:brand:check` first and fail on stale output.
- The generator renders everything in memory and stages temporary files before replacing outputs.
- Metadata asset URLs include a hash of `logo.json` so browsers and social crawlers receive a new URL after brand changes.

## Metadata

`index.html` references the SVG favicon, PNG fallback, Apple touch icon, and PNG social image. Canonical and social URLs use the build-time `VITE_SITE_URL` variable. Set it without a trailing slash for each environment; the current local environment uses `https://testlab.walleye-koi.ts.net`.

## Verification

After brand changes, run:

```bash
npm run generate:brand
npm run generate:brand:check
npm run build
npm test -- --run
```

Brand tests verify output freshness, canonical model placement, single-pass 20-degree pin rotation, pin clipping, and PNG dimensions. Also confirm that `/favicon.svg`, `/favicon-32.png`, `/apple-touch-icon.png`, and `/og-image.png` return their expected image MIME types from the built site.
