# Apache Doris Key Features Landing Page — Design

**Status**: Approved (2026-05-06)
**Owner**: Mingyu Chen (Rayner)
**Scope**: First-phase framework + seed content. Subsequent docs grow without frontend changes.

---

## 1. Context & Goals

Build a hardcore, engineer-facing landing page that surfaces Apache Doris's distinctive technical capabilities, while doubling as a reusable concept reference for other landing pages (use-case pages, blog posts, etc.).

Two-part content model:

- **Core Features** — a curated set of ~10 narratives ("Hybrid Search", "Lakehouse", …). Stable, slow-growing. Each is a lightweight intro page (500–1000 words) plus a list of related concepts.
- **Concept Glossary** — atomic technical entries ("BM25", "Inverted Index", "ANN Search", …). Many, continuously growing. Cross-referenced from Core Features and from any other page on the site.

Hard requirements:

1. English only (no i18n in this phase).
2. Adding a new doc must require **only** writing markdown (and at most updating one config) — never editing frontend layout code.
3. Every Glossary entry has a stable, deep-linkable URL.
4. Visual identity should signal "engineer reference", distinct from the marketing tone of `use-cases-next`.
5. Mobile must be designed in from day one (three breakpoints).
6. No lint or validation tooling in this phase. Trust authors. (Lint can come later.)

---

## 2. Site Map & URLs

Entry point reuses the existing **"Why Doris" navbar dropdown**, which already has a `Key Features (coming soon)` placeholder.

```
/why-doris/key-features                                → Landing            (bespoke React)
/why-doris/key-features/glossary                       → Glossary index     (bespoke React)
/why-doris/key-features/features/<feature-slug>        → Feature article    (Docs plugin)
/why-doris/key-features/glossary/<term-slug>           → Glossary entry     (Docs plugin)
```

Configuration:

- A new `@docusaurus/plugin-content-docs` plugin instance with `id: 'key-features'`, `routeBasePath: 'why-doris/key-features'`, `path: 'key-features-docs'`, `sidebarPath: false` (articles are standalone, no sidebar tree).
- The two bespoke pages live in `src/pages/why-doris/key-features/`. Because the docs plugin instance has no `intro.md` / `index.md`, the `src/pages/...` routes claim the root and `/glossary` URLs. **Verified in build output as part of the first PR** (see Risks §7).
- Article pages still get the full Docusaurus docs theme: TOC, breadcrumbs (`Key Features / …`), prev/next, and search index participation.

Navbar wiring (single change):

```diff
// src/components/home-next/NavbarNext.tsx:38
- { label: 'Key Features (coming soon)', href: '#' },
+ { label: 'Key Features', href: '/why-doris/key-features' },
```

---

## 3. Content Model

### 3.1 Feature pages

Path: `key-features-docs/features/<slug>.md`

```yaml
---
slug: hybrid-search                  # optional; defaults to filename
title: Hybrid Search
summary: Unified vector + full-text + scalar search in one engine.
related_concepts:
  - bm25
  - inverted-index
  - ann-search
---

# What it solves
…

# How it works
…

# When to use it
…

<RelatedConcepts />
```

Body length target: 500–1000 words. Free-form markdown/MDX. The `<RelatedConcepts />` MDX component reads `related_concepts` from frontmatter and renders link cards to each Glossary entry. Authors may also pass an explicit `ids` prop to override.

### 3.2 Glossary entries

Path: `key-features-docs/glossary/<slug>.md`

```yaml
---
slug: bm25
title: BM25
summary: Probabilistic ranking function for full-text relevance scoring.
tags: [search, indexing, algorithm]
---

<TagChips />

Body (300–800 words): definition, formula(s), short example, references.

<RelatedConcepts ids={['inverted-index', 'tf-idf']} />
```

Authors place `<TagChips />` manually under the H1 in this phase (a single line — auto-injection via theme swizzle is deferred).

### 3.3 Tag vocabulary

Tags in markdown frontmatter are arbitrary strings. A registry file at `key-features-docs/_tags.yml` provides **display metadata only** (label + color):

```yaml
# Functional area
storage:                       { label: "Storage",                color: "#3b82f6" }
query-engine:                  { label: "Query Engine",            color: "#8b5cf6" }
indexing:                      { label: "Indexing",                color: "#10b981" }
search:                        { label: "Search",                  color: "#7c3aed" }
lakehouse:                     { label: "Lakehouse",               color: "#f59e0b" }
ai:                            { label: "AI",                      color: "#ec4899" }
observability:                 { label: "Observability",           color: "#06b6d4" }
ingestion:                     { label: "Ingestion",               color: "#14b8a6" }
compute-storage-decoupling:    { label: "Compute-Storage Sep.",    color: "#6366f1" }
availability:                  { label: "Availability",            color: "#84cc16" }
security:                      { label: "Security",                color: "#ef4444" }

# Concept type (orthogonal)
algorithm:              { label: "Algorithm",              color: "#0891b2" }
data-structure:         { label: "Data Structure",         color: "#9333ea" }
file-format:            { label: "File Format",            color: "#f97316" }
protocol:               { label: "Protocol",               color: "#64748b" }
mechanism:              { label: "Mechanism",              color: "#0d9488" }
architecture-component: { label: "Architecture",           color: "#dc2626" }
```

Behavior:

- Tag in registry → chip rendered with configured label + color.
- Tag **not** in registry → chip rendered with the slug as its label and a default neutral grey color. Author can register the tag later by adding a line to `_tags.yml`.

No allow-list enforcement. No build error on unknown tags. (Lint deferred.)

### 3.4 Landing card config

Curated. Path: `src/data/key-features.config.ts`.

```ts
export interface FeatureCard {
  slug: string;          // links to /why-doris/key-features/<slug>
  title: string;
  tagline: string;       // single line, ≤ 60 chars
  bullets: string[];     // 3–5 short capability points
  icon: string;          // path under /static
  featured?: boolean;    // double-width on desktop
}

export const KEY_FEATURES: FeatureCard[] = [
  {
    slug: 'hybrid-search',
    title: 'Hybrid Search',
    tagline: 'Vector + full-text + scalar in one query',
    bullets: [
      'Native vector index with HNSW',
      'Inverted index with BM25 scoring',
      'Hybrid scoring & re-ranking',
      'Single SQL surface',
    ],
    icon: '/images/key-features/hybrid-search.svg',
    featured: true,
  },
  // … 9 more curated entries
];
```

Why config-driven rather than auto-globbed: the landing surface needs deliberate ordering and emphasis (`featured: true`). The card payload (tagline, bullets, icon) is layout-intent that does not belong in article frontmatter. Glossary, by contrast, is auto-globbed because the goal there is exhaustive discoverability.

### 3.5 Cross-reference contract

| Referrer                    | Mechanism                                                                  |
| --------------------------- | -------------------------------------------------------------------------- |
| Feature page                | `related_concepts` frontmatter + `<RelatedConcepts />` at end              |
| Glossary entry → peer entry | `<RelatedConcepts ids={['…']} />`                                          |
| Use-case landing / blog     | Plain markdown link to `/why-doris/key-features/glossary/<slug>` (or `/why-doris/key-features/features/<slug>`) |

Slugs are a contract once published. Renames must register a redirect via the existing `@docusaurus/plugin-client-redirects` config.

---

## 4. Page Composition

### 4.1 Visual identity

Engineer-facing, distinct from `use-cases-next`'s bright marketing tone:

- Darker palette with a subtle geometric grid background.
- Monospace accents on technical chrome (tag chips, slugs, counters).
- Line-driven motifs over illustration-heavy artwork.
- Defer ornamental polish (animated grids, counter increment animations) to a second pass.

### 4.2 Landing page (`/why-doris/key-features`)

Composition (top to bottom):

1. **Hero** — stable narrative that does not change as features are added. Just a main title and a subtitle, mirroring the structural simplicity of `src/components/use-cases-next/CustomerFacingAnalyticsNext.tsx`'s `Hero`. Title (placeholder, revise later): "Apache Doris is a real-time analytical database built for hybrid workloads." Subtitle: a single sentence on technical philosophy. **No pillar tags, no CTAs** — those add concepts the page does not need to do its job.
2. **Feature card grid** — driven entirely by `KEY_FEATURES`. Order in array == render order.
3. **Glossary CTA banner** — full-width section with copy ("Need to look up a specific technique?"), a counter ("142 concepts indexed and growing"), and a primary `Browse Concept Glossary →` link. The count is read from `useGlobalData()['key-features-glossary-index'].entries.length` — the same source the index page uses, so there is one source of truth.

Card layout:

| Breakpoint   | Grid columns | Regular card | Featured card |
| ------------ | ------------ | ------------ | ------------- |
| ≥ 996px      | 12           | 4 cols       | 8 cols        |
| 640–996px    | 6            | 6 cols       | 6 cols (taller) |
| < 640px      | 1            | full width   | full width (more padding, larger icon) |

On mobile, `featured` cards do not get extra width (there is none); the visual emphasis comes from increased padding, larger icon, and additional bullet space.

Card hover (desktop): subtle elevation and an icon-color border accent.

### 4.3 Glossary index page (`/why-doris/key-features/glossary`)

Desktop layout:

- Page header (title, summary, entry count).
- **Sticky filter bar** below the global navbar:
  - Search input (typeahead by title; client-side `startsWith` in this phase, fuzzy later).
  - Two chip groups: Functional Area and Concept Type. Chips show the registry's color and label.
  - Active filter summary line + `Clear all`.
- **Entry list**: alphabetical (A–Z) with sticky single-letter section headers. Each entry shows title (link), summary, and tag chips.

Filter logic: **OR within a group, AND across groups.** Example: selecting `indexing`, `search`, `algorithm` matches `(indexing OR search) AND (algorithm)`. The filter state is mirrored to the URL query string (`?tag=indexing,search,algorithm`) so filtered views are shareable.

Group membership is determined by `_tags.yml`: the file is sectioned into "Functional area" and "Concept type", and each tag is classified by which section it appears in. URL-hydration rules:

- A tag in the URL that is registered in `_tags.yml` activates its corresponding chip in the matching group.
- A tag in the URL that is **not** in `_tags.yml` is silently dropped on hydration (the chip cannot render without registry metadata, so it cannot participate in filtering).
- Duplicate tags in the URL are de-duplicated.

Mobile (< 640px) layout:

- Search input — full width.
- A single button replaces the chip bar: `[⚙ Filter (n)]` with an inline list of active filters and a `Clear` action.
- Tapping the button opens a **bottom-sheet drawer** with the chip groups, an `Apply (47)` button (where `47` is the live count of currently-matched entries), and a `Clear all` action. Page scroll is locked while the sheet is open.
- Sticky letter headers are preserved on the entry list (still useful as a wayfinding aid in a long single-column list).

### 4.4 Article pages (Feature + Glossary entry)

Use the default Docusaurus docs theme — TOC on the right (collapses to a top "On this page" disclosure on mobile), breadcrumbs, prev/next, "Edit this page" link to GitHub.

Customizations:

- Glossary entries place `<TagChips />` directly under the H1 (manual; one line). Chips wrap (`flex-wrap: wrap`) on narrow viewports.
- `<RelatedConcepts />` rendered at the end. Its card grid collapses to a single column under 640px.

---

## 5. Authoring Workflow

### Add a Glossary entry (most frequent)

1. `touch key-features-docs/glossary/<slug>.md`
2. Write frontmatter (`slug`, `title`, `summary`, `tags`) + body. Add `<TagChips />` under the H1 and `<RelatedConcepts />` (or `<RelatedConcepts ids={[…]} />`) at the end.
3. `yarn start` → article live at `/why-doris/key-features/glossary/<slug>`; index updates automatically; site search picks it up.

No frontend code change.

### Add a Core Feature

1. New markdown at `key-features-docs/features/<slug>.md` with frontmatter and body.
2. Append a card object to `KEY_FEATURES` in `src/data/key-features.config.ts`.
3. Drop an SVG at `static/images/key-features/<slug>.svg`.

No frontend code change.

### Register a new tag (optional)

Append a line to `_tags.yml` to give it a label and color. Skipping this still works — the chip renders with default styling.

### Edit existing content

Edit the markdown directly. Dev server hot-reloads.

### Rename a slug

Slugs are stable contracts. Renaming requires:

1. Renaming the file and updating the `slug` frontmatter field.
2. Adding a `from → to` entry to the `client-redirects` plugin in `docusaurus.config.js`.
3. Searching the repo for any internal markdown links that reference the old slug and updating them.

---

## 6. Implementation Surface

### 6.1 New files

```
# Bespoke React (landing + glossary index)
src/pages/why-doris/key-features/
  index.tsx
  index.scss
  glossary/
    index.tsx
    index.scss

# Reusable components
src/components/key-features/
  KeyFeaturesHero.tsx + .scss
  FeatureCardGrid.tsx + .scss
  FeatureCard.tsx + .scss
  GlossaryCTABanner.tsx + .scss
  GlossaryFilterBar.tsx + .scss
  GlossaryFilterSheet.tsx + .scss      # mobile bottom-sheet
  GlossaryEntryList.tsx + .scss
  TagChip.tsx + .scss
  TagChips.tsx + .scss
  RelatedConcepts.tsx + .scss
  useGlossaryFilters.ts                # filter state + URL sync hook

# Data / configuration
src/data/key-features.config.ts        # 10 curated cards

# Docs plugin content root
key-features-docs/
  _tags.yml
  features/
    .gitkeep
  glossary/
    .gitkeep

# Custom Docusaurus plugin: glossary metadata aggregator
plugins/key-features-glossary-index/
  index.js                             # ~50 LOC

# Icons (per feature)
static/images/key-features/<slug>.svg  # one per Core Feature card
```

### 6.2 Modified files

- `docusaurus.config.js` — register the new docs plugin instance, register the custom glossary index plugin, register `RelatedConcepts` and `TagChips` as global MDX components.
- `src/components/home-next/NavbarNext.tsx:38` — wire the navbar entry.

### 6.3 Custom plugin: `plugins/key-features-glossary-index`

Reads every file in `key-features-docs/glossary/*.md` at build time, parses YAML frontmatter, and emits the result via Docusaurus's `setGlobalData` so client components can read it via `useGlobalData()` with no runtime fetch.

```js
// Sketch — actual file ~50 LOC
module.exports = function (context) {
  const glossaryDir = path.join(context.siteDir, 'key-features-docs', 'glossary');
  return {
    name: 'key-features-glossary-index',
    getPathsToWatch() {
      return [path.join(glossaryDir, '**/*.md')];
    },
    async loadContent() {
      const files = glob.sync(path.join(glossaryDir, '*.md'));
      return files.map(f => {
        const { data: fm } = matter(fs.readFileSync(f, 'utf8'));
        return {
          slug: fm.slug || path.basename(f, '.md'),
          title: fm.title,
          summary: fm.summary,
          tags: fm.tags || [],
        };
      });
    },
    async contentLoaded({ content, actions }) {
      actions.setGlobalData({ entries: content });
    },
  };
};
```

Two implementation notes:

- All filesystem paths are resolved against `context.siteDir` rather than relative paths, so the plugin works across build environments (CI, local dev with cwd ≠ repo root).
- `getPathsToWatch()` is required so dev-server hot reload picks up new/changed glossary markdown. Without it, adding a new entry won't appear until manual restart.

### 6.4 First-phase scope

**In scope** (this phase):

- Navbar wiring.
- Docs plugin instance + routing.
- Landing page (hero, card grid, CTA banner).
- Glossary index (desktop chip bar + mobile bottom-sheet + alphabetical list + URL-synced filter state).
- `<RelatedConcepts />` and `<TagChips />` MDX components.
- `_tags.yml` display registry (no enforcement).
- Custom glossary index plugin.
- Responsive styling at all three breakpoints.
- Seed content:
  - 2–3 Feature articles (Hybrid Search, Lakehouse, plus one non-`featured` to validate that variant).
  - 5–10 Glossary entries covering 3–4 different tag combinations to exercise the filter.

**Out of scope** (deferred to later phases):

- Lint / validation tooling.
- Auto-injection of `<TagChips />` via docs theme swizzle (authors place it manually for now).
- Fuzzy search / typeahead in the Glossary index (use `startsWith` in this phase).
- Hero ornamental polish (animated grids, geometric backgrounds, counter-increment animations).
- Tag color tokens promoted into a shared design system.
- i18n.

---

## 7. Risks

### 7.1 Route collision and slug-routing — VERIFIED 2026-05-06

This was the load-bearing technical assumption of the design. Verified empirically during Task 0.1 by inspecting `.docusaurus/routes.js`:

1. **`src/pages` vs docs plugin at the route root**: ✅ Pages plugin wins. Both register `/why-doris/key-features/`, but pages plugin's route has `exact: true` and is registered first. Docs plugin's wrapper route is non-exact and serves nested article routes only.

2. **`routeBasePath` + per-doc `slug` URL behavior**: Per-doc `slug` replaces only the **filename**, not the parent directory path. So:
   - `key-features-docs/features/<file>.md` with `slug: foo` → `/why-doris/key-features/features/foo`
   - `key-features-docs/glossary/<file>.md` with `slug: foo` → `/why-doris/key-features/glossary/foo`

   This means **feature article URLs include `/features/` segment** (originally not anticipated). The plan and spec were updated to reflect this: feature URLs are `/why-doris/key-features/features/<slug>`. URL pattern is now symmetric with the glossary path.

   To override (if a future use case needs flat URLs), authors can use absolute slugs: `slug: /why-doris/key-features/foo`.

### 7.2 Custom plugin hot reload

If `getPathsToWatch()` is omitted, adding a new glossary markdown will not refresh the index page in dev. The implementation must include this hook, and PR review must check it.

### 7.3 Card slug ↔ feature article filename drift (DX)

Because lint is out of phase scope, a card config entry (`KEY_FEATURES[i].slug`) can reference a non-existent feature article filename without producing any build error — the link will 404 silently. **Optional** dev-only mitigation: in `FeatureCardGrid.tsx`, add a `console.warn()` in development mode when a card slug doesn't match any file emitted by the docs plugin's metadata. Not in MVP scope; a candidate for the second pass if author drift becomes a problem.

---

## 8. Open Questions

None blocking. Items intentionally deferred:

- The hero's title and subtitle copy is placeholder. Revise once the framework lands and we have a concrete stance.
- Whether to swizzle for auto `<TagChips />` injection. Revisit after the manual approach has been used a few times.
