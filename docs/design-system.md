# Design system: Industrial Luxe

Source: the `design.md` brief. Implemented in Tailwind v4 (CSS-first) under `client/src/styles/`, imported by
`client/src/app/globals.css`. A living style guide is at `/design-system` in the client (not indexed).

| File | Contents |
|---|---|
| `tokens.css` | One `@theme` block: colours, fonts, type sizes, radii, spacing, shadows. Each token is a Tailwind utility **and** a CSS variable |
| `base.css` | Body, selection, focus outline, reduced-motion |
| `typography.css` | `type-*` role utilities (family, weight, tracking, mobile size below `md`) |
| `components.css` | `btn`, `card`, `pill`, form controls, `segmented`, `search-bar`, `spec-*`, `price`, layout helpers |

Fonts (Space Grotesk, Work Sans, JetBrains Mono) are loaded with `next/font` in `app/layout.js` and feed `--font-display`,
`--font-body` and `--font-mono`.

## Using it
```jsx
<h1 className="type-display-xl">Move heavy things</h1>
<p className="type-body-md text-neutral-700">Call the owner directly.</p>
<span className="type-label-mono-md">Max reach 42 m</span>

<button className="btn btn-primary">Post an ad</button>       {/* btn-secondary, btn-ghost, btn-danger */}
<button className="btn btn-primary btn-sm md:btn-lg">        {/* sizes: btn-sm, btn-lg, btn-icon, btn-block */}

<article className="card card-interactive">…</article>         {/* card-dark for high-tier / feature cards */}
<span className="pill pill-available pill-dot">Available now</span>

<label className="label" htmlFor="t">Title</label>
<input id="t" className="input" aria-invalid="true" />         {/* also .select .textarea .checkbox .radio */}
<span className="field-error">Enter a title.</span>

<div className="container-page"><div className="grid-page">…</div></div>   {/* 4 / 8 / 12 columns */}
```
Everything composes with Tailwind utilities and breakpoint prefixes (`w-full md:w-auto`). Hover, active, focus-visible,
disabled, checked and `aria-*` states are built into the classes.

## Tokens
- **Colour:** the brief's semantic set is used verbatim (`bg-surface`, `text-on-surface`, `bg-primary-container`,
  `text-error` ...). Brand colours from its prose: `canvas` (page), `charcoal`, `amber`, `amber-deep`, `amber-ink`, and
  `neutral-50 … 900`. Tailwind's default palette is switched off, so only these colours exist.
- **Text on light backgrounds:** `amber` and `amber-deep` are too pale for text on white. Use `text-primary`
  (`#7C5800`) or `text-amber-ink` (`#926300`) for amber-family text.
- **Radius:** Tailwind's scale is kept (`rounded-xl` 12px for controls, `rounded-2xl` 16px cards, `rounded-3xl` 24px dark
  cards and modals). Aliases: `rounded-control`, `rounded-card`, `rounded-card-lg`, `rounded-pill`.
- **Spacing:** `gutter`, `margin`, `space-xs … space-2xl` (`p-space-md`, `gap-gutter`, `py-space-2xl`); `max-w-page` = 1440px.
- **Elevation:** `shadow-resting`, `shadow-hover`, `shadow-floating`, `shadow-focus` (amber halo); `backdrop-blur-frost`.
- **Breakpoints:** Tailwind defaults match the brief: mobile below `md` (768), tablet `md`, desktop `xl` (1280).

## Where the brief was ambiguous
- Its frontmatter page colour is `#FCF9F2` while its prose says `#FBFAF8`; the page uses `canvas` (`#FBFAF8`), and
  `surface` / `background` keep `#FCF9F2`.
- The frontmatter radius names (`xl` = 24px) differ from Tailwind's, and the prose uses Tailwind's names, so the prose
  wins. The light card is 16px (`rounded-2xl`), not the 20px the prose also mentions.
- Text on the amber button is charcoal (prose), not the frontmatter `on-primary-container`.

## Frontend structure
- `src/layout/` header, footer, mobile menu and the shared link list (`navigation.js`); `src/app/(main)/layout.js` wraps public pages.
- `src/components/home/`, `ads/`, `ui/`: page sections, the reusable `AdCard`, and small shared pieces.
- `src/lib/data.js`: server-side calls to the API (each returns a fallback if the API is down, and revalidates every 5 to 60 minutes).
- `src/lib/seo.js`: builds Next.js metadata from the admin-managed `seo.default` / `seo.pages` settings, plus JSON-LD helpers.
- Ad and category photos are served by `next/image` from the R2 host in `NEXT_PUBLIC_IMAGE_BASE_URL`.

## Dark mode
- The theme is `data-theme="light" | "dark"` on `<html>`. A small script in `app/layout.js` sets it before first paint from the saved choice (`localStorage.theme`) or, if none, the operating system setting. `layout/ThemeToggle.js` flips and saves it.
- `styles/dark.css` redefines only the variables that carry surface and text meaning (`white` = raised surfaces, `canvas`, `neutral-*`, `surface-*`, `primary`, `error*`, shadows). Amber and charcoal do not change.
- Text on a fixed background uses `text-on-amber` / `text-on-charcoal` (they never flip). A block with its own amber or charcoal background gets `scheme-light` (or `on-dark`), which restores the light-mode colours inside it.
- `dark:` works as a Tailwind variant (`dark:hidden`) for the few places that need it.
