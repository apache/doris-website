# New Homepage Architecture

> Reference doc for the redesigned Apache Doris homepage. When the user says
> "optimize the new Doris homepage", use this as the map of where to make changes.
>
> Companion to `homepage-redesign.md` (the original *plan*); this doc describes
> the actual *implemented* code.

---

## TL;DR — where things live

| Concern                          | File                                                                  |
| -------------------------------- | --------------------------------------------------------------------- |
| URL → version selection          | `src/pages/index.tsx`                                                 |
| Floating "Try New Design" button | `src/components/home-version-toggle/HomeVersionToggle.tsx`            |
| **New homepage entry point**     | `src/components/home-next/HomeNext.tsx`                               |
| **New homepage layout shell**    | `src/components/home-next/LayoutNext.tsx`                             |
| **New navbar**                   | `src/components/home-next/NavbarNext.tsx` + `NavbarNext.scss`         |
| **Hero section (V1, designed)**  | `src/components/home-next/sections/HeroSection.tsx` + `.scss`         |
| Other sections (placeholders)    | `src/components/home-next/sections/*.tsx`                             |
| Classic homepage (legacy)        | `src/components/home-classic/HomeClassic.tsx`                         |
| Visual reference for new design  | `prototype/heroes.jsx`, `prototype/heroes.css`, `prototype/styles.css` |

---

## 1. Routing — how `/` picks a version

The new homepage does **not** live at a separate URL. The route stays `/`,
and `src/pages/index.tsx` chooses which component to render based on a
`localStorage` flag.

### `src/pages/index.tsx` (the switch)

```tsx
const HOME_VERSION_KEY = 'doris-home-version';

export default function Home(): JSX.Element {
    const [isNext, setIsNext] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // SSR-safe: read localStorage only on the client
        setIsNext(localStorage.getItem(HOME_VERSION_KEY) === 'next');
        setMounted(true);
    }, []);

    const handleToggle = (next: boolean) => {
        if (next) localStorage.setItem(HOME_VERSION_KEY, 'next');
        else      localStorage.removeItem(HOME_VERSION_KEY);
        setIsNext(next);
    };

    return (
        <>
            {isNext
                ? <HomeNext    onSwitchBack={() => handleToggle(false)} />
                : <HomeClassic onTryNew={()    => handleToggle(true)} />}
            {mounted && <HomeVersionToggle isV2={isNext} onToggle={() => handleToggle(!isNext)} />}
        </>
    );
}
```

Rules:

- **localStorage key**: `doris-home-version`
- **Value `'next'`** → render `HomeNext`
- **Anything else / missing** → render `HomeClassic` (the existing homepage)
- The toggle button only mounts after the first client render (`mounted` flag)
  to avoid SSR hydration mismatches.

> Note: the original plan doc (`homepage-redesign.md`) calls the value `'v2'`.
> The implementation uses `'next'`. If you need to switch versions in DevTools:
> `localStorage.setItem('doris-home-version', 'next')` then refresh.

### `HomeVersionToggle`

`src/components/home-version-toggle/HomeVersionToggle.tsx` — a single
`<button>` fixed to the bottom-right corner. Two visual states:

- Classic view: green pill — *"✨ Try New Design"*
- New view: outline — *"← Back to Classic"*

Styles in the sibling `HomeVersionToggle.module.css`. The button itself is
trivial; the toggle *logic* lives entirely in `index.tsx`.

---

## 2. New homepage component tree

```
HomeNext.tsx                        ← root, assembles sections
└── LayoutNext.tsx                  ← Docusaurus shell + navbar + footer
    ├── LayoutProvider              (Docusaurus theme provider)
    ├── PageMetadata                (title / description for SEO)
    ├── AnnouncementBar             (Docusaurus theme component)
    ├── NavbarNext.tsx              ← custom dark-green navbar
    ├── <main>                      ← sections render here
    │   ├── HeroSection.tsx         ✅ designed (V1 from prototype/)
    │   ├── StatsSection.tsx        ⏳ placeholder
    │   ├── FeaturesSection.tsx     ⏳ placeholder
    │   ├── UseCasesSection.tsx     ⏳ placeholder
    │   ├── CommunitySection.tsx    ⏳ placeholder
    │   └── GetStartedSection.tsx   ⏳ placeholder
    └── Footer                      (Docusaurus theme component)
```

### `HomeNext.tsx`

Just a thin wrapper that imports `LayoutNext` and the section components in
order. Keep this file boring — section composition only.

```tsx
<LayoutNext title="..." description="...">
    <HeroSection />
    <StatsSection />
    <FeaturesSection />
    <UseCasesSection />
    <CommunitySection />
    <GetStartedSection />
</LayoutNext>
```

### `LayoutNext.tsx`

The Docusaurus chrome: `LayoutProvider` + `PageMetadata` + `AnnouncementBar` +
`NavbarNext` + `<main>{children}</main>` + `Footer`. Don't add page-level
styling here; styling belongs in the section components.

### `NavbarNext.tsx` + `NavbarNext.scss`

Custom navbar (intentionally not the Docusaurus default). Dark-green theme
(`#06805F`) with cream text, JetBrains Mono typography, a yellow "Get Started"
CTA, and a **live GitHub star pill** on the right.

GitHub stars are fetched at runtime:

```tsx
function useGitHubStars(repo: string, fallback: string): string {
    // GET https://api.github.com/repos/<repo>
    // → reads stargazers_count → formats "14237" → "14.2k"
    // → silently falls back to `fallback` on network/CORS/rate-limit errors
}
```

The fallback string `"14.2k"` is rendered server-side and during the initial
client render, then replaced once the fetch resolves. Fallback is
hard-coded as the constant `FALLBACK_STARS` at the top of the file.

`NAV_ITEMS` (Why Doris / Use Cases / Docs / Blogs / Community) is also a
constant at the top of the file — edit there to change the menu structure.

---

## 3. Hero section — the only fully-designed section

### Files

- `sections/HeroSection.tsx` — component + animations
- `sections/HeroSection.scss` — all hero styles (scoped under `.hero-next`)

### Visual structure

```
.hero-next
├── .hero-next__bg-glow         (radial gradients, decorative)
├── .hero-next__bg-grid         (dot grid pattern, decorative)
├── .hero-next__bolt-bg         (large ghost lightning SVG, top-right)
├── .hero-next__content         (the actual 2-column grid)
│   ├── .hero-next__left
│   │   ├── eyebrow:  "APACHE DORIS · v3.0 RELEASED"
│   │   ├── title:    LIGHTNING / FAST⚡ / ANALYTICS AND / SEARCH DATABASE
│   │   ├── sub:      one-paragraph product description
│   │   ├── ctas:     Download (yellow) · Get Started (cream) · Join Slack (ghost)
│   │   └── meta:     600+ Contributors · 5,000+ Companies · Apache 2.0
│   └── .hero-next__right
│       └── .hero-next__card-wrap
│           ├── .hero-next__sql-wrap
│           │   ├── <SqlCard>            ← animated SQL terminal
│           │   └── .hero-next__perf-pill ← floating yellow banner
│           └── <SearchResults>          ← animated ranked results
└── .hero-next__shape (×N)               (floating yellow diamond / ring)
```

### Animations

Two interlocking loops, both written as React hooks/components inside
`HeroSection.tsx`:

1. **`useTypewriter(SQL_LINES, speed, finalPause)`**
   Drives the SQL card. Treats every line as an array of typed `[class, text]`
   tokens, advances one character per tick (`setInterval`), pauses, then loops.
   The cursor renders on the currently-active line; the "Executing query…"
   footer flips to "5 docs · scanned 18.4M vectors · 0.043s" when finished.

2. **`SearchResults` cycle**
   Reveals rows one by one (`setTimeout` staggered), then fills the score bars
   with a CSS `width` transition, holds for ~6.5s, restarts.

Both can be tuned by editing the constants at the top of their respective
sections (`SQL_LINES`, `SEARCH_RESULTS`, hard-coded ms values).

### The floating perf banner — non-obvious layout

The yellow *"Structured + Full-text + Vector — all in one SQL."* pill needs to
sit visually **between** the SQL card and the search results without taking
layout space. The trick:

- It lives inside `.hero-next__sql-wrap` (a `position: relative` wrapper around
  `<SqlCard>`).
- It is `position: absolute; right: 16px; bottom: -18px; z-index: 20`.
- This makes it hang ~18px below the SQL card, straddling the 12px flex gap
  and dipping slightly into both panels — without affecting either card's
  height or the column flow.

If you change card spacing, re-tune `bottom` and `right` here. Don't try to
make it a flex item — that breaks the overlay.

---

## 4. Design tokens

There is no global design-token file. Tokens are **scoped per component** so
the new design can't leak into the rest of the site (Docusaurus pages, classic
homepage, docs, etc.):

- Hero tokens: declared on `.hero-next` in `HeroSection.scss` (`--hn-*`).
- Navbar tokens: declared on `.navbar-next` in `NavbarNext.scss` (`--nb-*`).

If you need a token in a new section, follow the same pattern — declare it on
the section's root class, prefix it (`--<component>-…`), and don't promote it
to `:root` until at least two components share it.

The visual reference for all tokens is `prototype/styles.css` (the original
HTML prototype). Colors, fonts, and the dark-green palette all come from
there.

---

## 5. Common change recipes

### "Optimize the new homepage" → starting points

1. **Hero copy / wording** → `sections/HeroSection.tsx`, the JSX inside
   `<HeroSection>`.
2. **Hero spacing / sizes** → `sections/HeroSection.scss`. The hero is
   currently tuned for above-the-fold density; check the `--hn-*` tokens and
   the `&__title`, `&__content`, `&__meta` blocks.
3. **SQL animation content** → `SQL_LINES` constant in `HeroSection.tsx`.
4. **Search results data** → `SEARCH_RESULTS` constant in `HeroSection.tsx`.
5. **Navbar links** → `NAV_ITEMS` constant in `NavbarNext.tsx`.
6. **GitHub repo / fallback star count** → `GITHUB_REPO` and `FALLBACK_STARS`
   constants in `NavbarNext.tsx`.
7. **A new section** → create `sections/NewSection.tsx` (+ optional `.scss`),
   add it to `HomeNext.tsx`'s render tree. Keep styles scoped under a unique
   class.

### Adding a new section (from placeholder to designed)

The placeholders (`StatsSection`, `FeaturesSection`, etc.) currently use
generic `home-next-*` classes defined in `HomeNext.scss`. When promoting one
to a real design:

1. Replace the placeholder JSX with the real markup.
2. Create `sections/<Name>Section.scss` and import it from the `.tsx` file.
3. Scope all styles under the section's root class (e.g. `.stats-next`).
4. Drop the placeholder class from `HomeNext.scss` once nothing references it.

### Switching the default version

Currently classic is the default. To make `HomeNext` the default for everyone:

```tsx
// src/pages/index.tsx — flip the read condition:
setIsNext(localStorage.getItem(HOME_VERSION_KEY) !== 'classic');
```

This treats the absence of the key (and any value other than `'classic'`) as
"new". Users who explicitly set `'classic'` keep the old homepage.

### Removing the toggle (final cleanup)

Once the new homepage is the permanent default:

1. Replace `src/pages/index.tsx` with a re-export of `HomeNext`.
2. Delete `src/components/home-classic/`.
3. Delete `src/components/home-version-toggle/`.
4. Drop the `onSwitchBack` prop from `HomeNext`.

---

## 6. Conventions to keep

- **Class naming**: BEM-style with a per-component prefix (`hero-next__…`,
  `navbar-next__…`, `hn-sql-card__…`). Prefixes prevent style leakage to / from
  Docusaurus and the classic homepage.
- **Heading overrides**: Docusaurus has aggressive global `h1`/`h2` rules.
  When a hero/section heading needs custom typography, override with
  `!important` on `font-family`, `font-weight`, `line-height`, `color`, and
  `margin` (see `.hero-next__title` for the pattern).
- **SSR safety**: anything reading `window` / `localStorage` / `fetch` must
  live inside `useEffect`. Initial state should be a stable fallback so the
  server-rendered HTML matches the first client render.
- **No new global CSS**: don't add rules to `:root` or to bare element
  selectors; everything goes under a scoped class.
