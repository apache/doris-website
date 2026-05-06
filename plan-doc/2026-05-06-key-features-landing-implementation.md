# Apache Doris Key Features Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hardcore engineer-facing "Key Features" landing page for Apache Doris with a curated 10-feature card grid and an auto-growing concept Glossary, where adding new docs requires only writing markdown.

**Architecture:** A new Docusaurus docs plugin instance (`id: 'key-features'`, `routeBasePath: 'why-doris/key-features'`) handles all article URLs and rendering. Two bespoke React pages (`src/pages/why-doris/key-features/index.tsx` for the landing and `.../glossary/index.tsx` for the glossary index) provide the curated UI surfaces. A custom Docusaurus plugin globs glossary markdown frontmatter at build time and emits it via `setGlobalData` for the index page to consume. MDX components `<RelatedConcepts />` and `<TagChips />` are registered globally so authors use them without imports.

**Tech Stack:**
- Docusaurus 3.6.3 (`@docusaurus/plugin-content-docs`, `@docusaurus/plugin-client-redirects`)
- React 18 + TypeScript
- SCSS (existing pattern in `src/components/*/`)
- `gray-matter` (already installed) for frontmatter parsing
- `js-yaml` (already installed) for `_tags.yml` parsing
- `node:test` + `node:assert/strict` for unit tests (project convention)

**Spec reference:** `plan-doc/2026-05-06-key-features-landing-design.md`

---

## File Structure & Decomposition

```
docusaurus.config.js                                       ← MODIFY: register docs plugin instance + custom plugin + MDX globals
src/components/home-next/NavbarNext.tsx                    ← MODIFY: line 38 swap href

src/pages/why-doris/key-features/
  index.tsx                                                ← NEW: bespoke landing page (assembly only, ~60 LOC)
  index.module.scss                                        ← NEW: page-level layout styles
  glossary/
    index.tsx                                              ← NEW: bespoke glossary index page (assembly only, ~80 LOC)
    index.module.scss                                      ← NEW: glossary layout styles

src/components/key-features/
  KeyFeaturesHero.tsx + .module.scss                       ← NEW: stable narrative hero
  FeatureCard.tsx + .module.scss                           ← NEW: single card (regular + featured variants)
  FeatureCardGrid.tsx + .module.scss                       ← NEW: grid wrapper, reads KEY_FEATURES, renders cards
  GlossaryCTABanner.tsx + .module.scss                     ← NEW: bottom CTA on landing
  TagChip.tsx + .module.scss                               ← NEW: single tag chip (registry-aware coloring)
  TagChips.tsx + .module.scss                              ← NEW: array of chips (wrap container)
  RelatedConcepts.tsx + .module.scss                       ← NEW: MDX component, reads frontmatter or props
  GlossaryFilterBar.tsx + .module.scss                     ← NEW: desktop chip-bar
  GlossaryFilterSheet.tsx + .module.scss                   ← NEW: mobile bottom-sheet drawer
  GlossaryEntryList.tsx + .module.scss                     ← NEW: A–Z list with sticky letter sections
  useGlossaryFilters.ts                                    ← NEW: filter state + URL sync hook

src/data/key-features.config.ts                            ← NEW: KEY_FEATURES card array + types

src/utils/key-features-tags.ts                             ← NEW: load + lookup helpers for _tags.yml

key-features-docs/                                         ← NEW: docs plugin content root
  _tags.yml                                                ← NEW: tag display registry
  features/
    .gitkeep
    hybrid-search.md                                       ← NEW: seed
    lakehouse.md                                           ← NEW: seed
    materialized-view.md                                   ← NEW: seed (non-featured)
  glossary/
    .gitkeep
    bm25.md                                                ← NEW: seed
    inverted-index.md                                      ← NEW: seed
    ann-search.md                                          ← NEW: seed
    iceberg.md                                             ← NEW: seed
    hudi.md                                                ← NEW: seed
    async-materialized-view.md                             ← NEW: seed
    lz4-compression.md                                     ← NEW: seed

plugins/key-features-glossary-index/
  index.js                                                 ← NEW: aggregator plugin
  __tests__/
    index.test.js                                          ← NEW: unit tests for parsing logic
  __fixtures__/
    valid-entry.md                                         ← NEW: test fixture
    minimal-entry.md                                       ← NEW: test fixture

static/images/key-features/
  hybrid-search.svg                                        ← NEW: placeholder icon
  lakehouse.svg                                            ← NEW: placeholder icon
  materialized-view.svg                                    ← NEW: placeholder icon
```

**File responsibility principle:** each component has one purpose. Card config is data-only (no JSX). The hook is pure logic (no DOM). The plugin is build-time only (no React). The two `index.tsx` pages are assembly only (no business logic). This keeps each file small and independently testable.

**Phase order (critical):**
- Phase 0 verifies the load-bearing routing assumption — must run first.
- Phases 1–2 build the foundation (registry, plugin, MDX components) used by everything else.
- Phase 3 builds the landing page; Phase 4 builds the glossary index. They can interleave but the plan keeps them sequential for review clarity.
- Phase 5 seeds content. Phase 6 polishes and verifies.

---

## Phase 0: Routing Verification (Day-One Smoke Test)

This phase exists because §7.1 of the spec identifies route resolution as the load-bearing technical assumption. **Do not proceed past Phase 0 until both routing claims are confirmed.**

### Task 0.1: Register docs plugin instance + minimal smoke files

**Files:**
- Modify: `docusaurus.config.js` (around line 197, after the `docs-next` plugin block)
- Create: `key-features-docs/features/_smoke-feature.md`
- Create: `key-features-docs/glossary/_smoke-term.md`
- Create: `src/pages/why-doris/key-features/index.tsx` (placeholder)

- [ ] **Step 1: Add docs plugin instance to `docusaurus.config.js`**

Locate the `plugins:` array. The insertion point is **immediately after the closing `]` of the `id: 'next'` content-docs entry, and immediately before the `process.env.NODE_ENV === 'development' ? null : customDocusaurusPlugin` ternary**. (Use those two strings as anchors — line numbers drift over time.) Insert:

```js
[
    'content-docs',
    /** @type {import('@docusaurus/plugin-content-docs').Options} */
    ({
        id: 'key-features',
        path: 'key-features-docs',
        routeBasePath: 'why-doris/key-features',
        sidebarPath: false,
        editUrl: 'https://github.com/apache/doris-website/edit/master/',
        showLastUpdateAuthor: false,
        showLastUpdateTime: false,
    }),
],
```

- [ ] **Step 2: Create smoke feature article**

`key-features-docs/features/_smoke-feature.md`:

```markdown
---
slug: _smoke-feature
title: Smoke Feature
---

# Smoke Feature

Routing verification placeholder. Will be deleted after Phase 0.
```

- [ ] **Step 3: Create smoke glossary entry**

`key-features-docs/glossary/_smoke-term.md`:

```markdown
---
slug: _smoke-term
title: Smoke Term
---

# Smoke Term

Routing verification placeholder. Will be deleted after Phase 0.
```

- [ ] **Step 4: Create placeholder landing page**

`src/pages/why-doris/key-features/index.tsx`:

```tsx
import React from 'react';
import Layout from '@theme/Layout';

export default function KeyFeaturesLanding(): JSX.Element {
    return (
        <Layout title="Key Features">
            <main style={{ padding: '4rem 2rem' }}>
                <h1>Key Features (placeholder)</h1>
                <p>If you can read this, the pages plugin won the route resolution.</p>
            </main>
        </Layout>
    );
}
```

- [ ] **Step 5: Build and verify URLs**

Run:

```bash
yarn build 2>&1 | tee /tmp/key-features-phase0-build.log
```

Expected: build succeeds with no errors. Then:

```bash
yarn serve --port 3030 &
SERVE_PID=$!
sleep 5

# Check 1: landing route
curl -s http://localhost:3030/why-doris/key-features/ | grep -q "If you can read this" && echo "PASS landing" || echo "FAIL landing"

# Check 2: feature article route
curl -s http://localhost:3030/why-doris/key-features/_smoke-feature/ | grep -q "Smoke Feature" && echo "PASS feature" || echo "FAIL feature"

# Check 3: glossary article route (this is the per-doc slug + routeBasePath claim)
curl -s http://localhost:3030/why-doris/key-features/glossary/_smoke-term/ | grep -q "Smoke Term" && echo "PASS glossary" || echo "FAIL glossary"

kill $SERVE_PID
```

Expected output: three `PASS` lines.

- [ ] **Step 6: Decision gate**

If all three PASS → proceed to Step 7.

If "FAIL landing" → docs plugin claimed the root. Apply fallback A: place an `intro.md` in `key-features-docs/` with `slug: /why-doris/key-features` and a Layout swizzle scoped to `pluginId: 'key-features'`. Re-run smoke test.

If "FAIL glossary" → per-doc `slug` is replacing the directory path, producing `/why-doris/key-features/_smoke-term` instead. Apply fallback B: change the smoke entry's frontmatter to `slug: /why-doris/key-features/glossary/_smoke-term` (absolute slug) and update the spec's authoring guidance + every later task that writes a `slug` frontmatter field. Re-run smoke test.

Document the result inline in the plan (which behavior was observed) before proceeding.

- [ ] **Step 7: Delete the smoke files**

```bash
rm key-features-docs/features/_smoke-feature.md
rm key-features-docs/glossary/_smoke-term.md
```

The placeholder `index.tsx` stays — it gets replaced incrementally in Phase 3.

- [ ] **Step 8: Commit**

```bash
git add docusaurus.config.js src/pages/why-doris/key-features/index.tsx
git commit -m "feat(key-features): add docs plugin instance and placeholder landing"
```

---

## Phase 1: Tag System & MDX Components

This phase builds the smallest reusable pieces — chips and the related-concepts component — that the landing and glossary pages consume.

### Task 1.1: Create `_tags.yml` and tag-loader utility

**Files:**
- Create: `key-features-docs/_tags.yml`
- Create: `src/utils/key-features-tags.ts`

- [ ] **Step 1: Create `_tags.yml`**

`key-features-docs/_tags.yml`:

```yaml
# Functional area
storage:                    { label: "Storage",              color: "#3b82f6" }
query-engine:               { label: "Query Engine",         color: "#8b5cf6" }
indexing:                   { label: "Indexing",             color: "#10b981" }
search:                     { label: "Search",               color: "#7c3aed" }
lakehouse:                  { label: "Lakehouse",            color: "#f59e0b" }
ai:                         { label: "AI",                   color: "#ec4899" }
observability:              { label: "Observability",        color: "#06b6d4" }
ingestion:                  { label: "Ingestion",            color: "#14b8a6" }
compute-storage-decoupling: { label: "Compute-Storage Sep.", color: "#6366f1" }
availability:               { label: "Availability",         color: "#84cc16" }
security:                   { label: "Security",             color: "#ef4444" }

# Concept type
algorithm:              { label: "Algorithm",     color: "#0891b2" }
data-structure:         { label: "Data Structure", color: "#9333ea" }
file-format:            { label: "File Format",   color: "#f97316" }
protocol:               { label: "Protocol",      color: "#64748b" }
mechanism:              { label: "Mechanism",     color: "#0d9488" }
architecture-component: { label: "Architecture",  color: "#dc2626" }
```

Document the section grouping (used by §4.3 of the spec for filter group classification): keys before the second `# Concept type` comment are Functional area; after are Concept type. Since YAML doesn't track comments, encode the grouping explicitly in the loader instead.

- [ ] **Step 2: Replace `_tags.yml` with grouped structure (revised)**

Replace the contents from Step 1 with:

```yaml
groups:
  functional-area:
    label: "Functional area"
    tags:
      storage:                    { label: "Storage",              color: "#3b82f6" }
      query-engine:               { label: "Query Engine",         color: "#8b5cf6" }
      indexing:                   { label: "Indexing",             color: "#10b981" }
      search:                     { label: "Search",               color: "#7c3aed" }
      lakehouse:                  { label: "Lakehouse",            color: "#f59e0b" }
      ai:                         { label: "AI",                   color: "#ec4899" }
      observability:              { label: "Observability",        color: "#06b6d4" }
      ingestion:                  { label: "Ingestion",            color: "#14b8a6" }
      compute-storage-decoupling: { label: "Compute-Storage Sep.", color: "#6366f1" }
      availability:               { label: "Availability",         color: "#84cc16" }
      security:                   { label: "Security",             color: "#ef4444" }
  concept-type:
    label: "Concept type"
    tags:
      algorithm:              { label: "Algorithm",      color: "#0891b2" }
      data-structure:         { label: "Data Structure", color: "#9333ea" }
      file-format:            { label: "File Format",    color: "#f97316" }
      protocol:               { label: "Protocol",       color: "#64748b" }
      mechanism:              { label: "Mechanism",      color: "#0d9488" }
      architecture-component: { label: "Architecture",   color: "#dc2626" }
```

This makes the group classification an explicit data structure, removing the comment-based encoding ambiguity.

- [ ] **Step 3: Create the loader utility**

`src/utils/key-features-tags.ts`:

```ts
import tagsRegistry from '@site/key-features-docs/_tags.yml';

export interface TagMeta {
    label: string;
    color: string;
}

export interface TagGroup {
    id: string;            // e.g. 'functional-area'
    label: string;         // human label, e.g. 'Functional area'
    tagIds: string[];      // tags belonging to this group, in declaration order
}

interface RegistryShape {
    groups: Record<string, {
        label: string;
        tags: Record<string, TagMeta>;
    }>;
}

const registry = tagsRegistry as RegistryShape;

const FALLBACK_COLOR = '#94a3b8';

const flatTagIndex: Record<string, TagMeta & { groupId: string }> = {};
const groupList: TagGroup[] = [];

for (const [groupId, group] of Object.entries(registry.groups)) {
    const tagIds: string[] = [];
    for (const [tagId, meta] of Object.entries(group.tags)) {
        flatTagIndex[tagId] = { ...meta, groupId };
        tagIds.push(tagId);
    }
    groupList.push({ id: groupId, label: group.label, tagIds });
}

export function getTagMeta(tagId: string): TagMeta {
    const found = flatTagIndex[tagId];
    if (found) return { label: found.label, color: found.color };
    return { label: tagId, color: FALLBACK_COLOR };
}

export function getTagGroup(tagId: string): string | null {
    return flatTagIndex[tagId]?.groupId ?? null;
}

export function listTagGroups(): TagGroup[] {
    return groupList;
}

export function isRegisteredTag(tagId: string): boolean {
    return tagId in flatTagIndex;
}
```

This requires Docusaurus to load `.yml` imports. Verify in Step 4.

- [ ] **Step 4: Add YAML import support**

Check whether `.yml` is already importable. Run:

```bash
grep -rn "yml-loader\|yaml-loader" /Users/morningman/workspace/git/doris-website/docusaurus.config.js /Users/morningman/workspace/git/doris-website/node_modules/@docusaurus/core/lib/webpack/base.js 2>/dev/null | head -5
```

If yaml-loader is not configured, add a custom plugin entry in `docusaurus.config.js` `plugins:` array:

```js
function yamlLoaderPlugin() {
    return {
        name: 'yaml-loader',
        configureWebpack() {
            return {
                module: {
                    rules: [
                        {
                            test: /\.ya?ml$/,
                            use: 'js-yaml-loader',
                        },
                    ],
                },
            };
        },
    };
}
```

And register `yamlLoaderPlugin,` in the plugins array. Install the loader:

```bash
yarn add --dev js-yaml-loader
```

Alternatively (simpler — use this if `js-yaml-loader` isn't trivially installable): change the import in Step 3 to `import` from a TypeScript module that re-exports the parsed YAML. Add `src/utils/key-features-tags.data.ts`:

```ts
// Generated/maintained by hand; mirrors key-features-docs/_tags.yml.
export const TAGS_REGISTRY = {
    groups: { /* ...same structure as _tags.yml... */ }
};
```

And import from there. The spec allows this — `_tags.yml` is the spec's preferred form, but the runtime data source can be the same content in TS if YAML loading is friction. Pick the simpler option that works on first try.

- [ ] **Step 5: Smoke-test the loader in dev**

Add a temporary `console.log` to a page (e.g., the placeholder landing) that calls `listTagGroups()`, run `yarn start`, confirm the registry loaded correctly, then remove the log.

- [ ] **Step 6: Commit**

```bash
git add key-features-docs/_tags.yml src/utils/key-features-tags.ts docusaurus.config.js
git commit -m "feat(key-features): add tag registry and loader"
```

---

### Task 1.2: Create `<TagChip />` and `<TagChips />` components

**Files:**
- Create: `src/components/key-features/TagChip.tsx`
- Create: `src/components/key-features/TagChip.module.scss`
- Create: `src/components/key-features/TagChips.tsx`
- Create: `src/components/key-features/TagChips.module.scss`

- [ ] **Step 1: Implement `TagChip`**

`src/components/key-features/TagChip.tsx`:

```tsx
import React, { JSX } from 'react';
import { getTagMeta } from '@site/src/utils/key-features-tags';
import styles from './TagChip.module.scss';

interface TagChipProps {
    tagId: string;
    onClick?: () => void;
    active?: boolean;
}

export function TagChip({ tagId, onClick, active }: TagChipProps): JSX.Element {
    const { label, color } = getTagMeta(tagId);
    const interactive = typeof onClick === 'function';

    const style: React.CSSProperties = {
        '--chip-color': color,
    } as React.CSSProperties;

    const className = [
        styles.chip,
        active ? styles.active : '',
        interactive ? styles.interactive : '',
    ].filter(Boolean).join(' ');

    if (interactive) {
        return (
            <button type="button" className={className} style={style} onClick={onClick} aria-pressed={active ?? false}>
                {label}
            </button>
        );
    }
    return <span className={className} style={style}>{label}</span>;
}
```

`src/components/key-features/TagChip.module.scss`:

```scss
.chip {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.625rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-family: var(--ifm-font-family-monospace, monospace);
    line-height: 1.5;
    color: var(--chip-color);
    background: color-mix(in srgb, var(--chip-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--chip-color) 30%, transparent);
    white-space: nowrap;
    user-select: none;
}

.interactive {
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover {
        background: color-mix(in srgb, var(--chip-color) 22%, transparent);
        border-color: color-mix(in srgb, var(--chip-color) 50%, transparent);
    }
}

.active {
    background: var(--chip-color);
    border-color: var(--chip-color);
    color: #fff;
}
```

- [ ] **Step 2: Implement `TagChips`**

`src/components/key-features/TagChips.tsx`:

```tsx
import React, { JSX } from 'react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { TagChip } from './TagChip';
import styles from './TagChips.module.scss';

interface TagChipsProps {
    tags?: string[];   // explicit override; if omitted, read from current doc frontmatter
}

// TagChips is invoked inside MDX docs — useDoc() is therefore always available.
// To stay compliant with the Rules of Hooks, we always call useDoc() at the top
// regardless of whether `tags` was passed explicitly.
export function TagChips({ tags }: TagChipsProps): JSX.Element | null {
    const doc = useDoc();
    const resolved = tags ?? ((doc.frontMatter.tags as string[] | undefined) ?? []);

    if (!resolved.length) return null;

    return (
        <div className={styles.row}>
            {resolved.map(t => <TagChip key={t} tagId={t} />)}
        </div>
    );
}
```

`src/components/key-features/TagChips.module.scss`:

```scss
.row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin: 0.5rem 0 1rem;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/key-features/TagChip.tsx src/components/key-features/TagChip.module.scss src/components/key-features/TagChips.tsx src/components/key-features/TagChips.module.scss
git commit -m "feat(key-features): add TagChip and TagChips components"
```

---

### Task 1.3: Create `<RelatedConcepts />` component

**Files:**
- Create: `src/components/key-features/RelatedConcepts.tsx`
- Create: `src/components/key-features/RelatedConcepts.module.scss`

- [ ] **Step 1: Implement `RelatedConcepts`**

`src/components/key-features/RelatedConcepts.tsx`:

```tsx
import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { useAllPluginInstancesData } from '@docusaurus/useGlobalData';
import styles from './RelatedConcepts.module.scss';

interface GlossaryEntry {
    slug: string;
    title: string;
    summary?: string;
    tags: string[];
}

interface RelatedConceptsProps {
    ids?: string[];
}

const GLOSSARY_PLUGIN_ID = 'key-features-glossary-index';

// RelatedConcepts is invoked inside MDX docs — both useDoc() and the global-data
// hook are therefore always callable. Hooks are placed at the top, before any
// conditional return, to comply with the Rules of Hooks.
export function RelatedConcepts({ ids }: RelatedConceptsProps): JSX.Element | null {
    const doc = useDoc();
    const allPlugins = useAllPluginInstancesData(GLOSSARY_PLUGIN_ID);

    const conceptIds = ids ?? ((doc.frontMatter.related_concepts as string[] | undefined) ?? []);
    if (!conceptIds.length) return null;

    const data = allPlugins?.default as { entries?: GlossaryEntry[] } | undefined;
    const entries = data?.entries ?? [];
    const bySlug = new Map(entries.map(e => [e.slug, e]));

    const resolved = conceptIds
        .map(id => bySlug.get(id))
        .filter((e): e is GlossaryEntry => Boolean(e));

    if (!resolved.length) return null;

    return (
        <section className={styles.section} aria-label="Related concepts">
            <h3 className={styles.heading}>Related concepts</h3>
            <ul className={styles.grid}>
                {resolved.map(entry => (
                    <li key={entry.slug} className={styles.card}>
                        <Link to={`/why-doris/key-features/glossary/${entry.slug}`} className={styles.link}>
                            <span className={styles.title}>{entry.title}</span>
                            {entry.summary && <span className={styles.summary}>{entry.summary}</span>}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
```

`src/components/key-features/RelatedConcepts.module.scss`:

```scss
.section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--ifm-color-emphasis-300);
}

.heading {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
    color: var(--ifm-color-emphasis-700);
    font-family: var(--ifm-font-family-monospace, monospace);
}

.grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.75rem;
}

.card {
    margin: 0;
}

.link {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.875rem 1rem;
    border: 1px solid var(--ifm-color-emphasis-200);
    border-radius: 8px;
    text-decoration: none;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover {
        border-color: var(--ifm-color-primary);
        background: var(--ifm-color-emphasis-100);
        text-decoration: none;
    }
}

.title {
    font-weight: 600;
    color: var(--ifm-color-emphasis-900);
}

.summary {
    font-size: 0.875rem;
    color: var(--ifm-color-emphasis-700);
}

@media (max-width: 640px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
```

Note: `RelatedConcepts` depends on the custom plugin's global data, which is built in Phase 2. Until then, it returns `null` (graceful no-op).

- [ ] **Step 2: Commit**

```bash
git add src/components/key-features/RelatedConcepts.tsx src/components/key-features/RelatedConcepts.module.scss
git commit -m "feat(key-features): add RelatedConcepts MDX component"
```

---

### Task 1.4: Register MDX components globally

**Files:**
- Modify: `src/theme/MDXComponents.js` (already exists in this repo)

- [ ] **Step 1: Read the existing MDXComponents file**

```bash
cat /Users/morningman/workspace/git/doris-website/src/theme/MDXComponents.js
```

It already maps custom components (e.g., `version: VersionsDoc`). The plan extends the same default-export object — do **not** create a new `.tsx` next to the `.js` (that risks duplicate-module resolution).

- [ ] **Step 2: Add the two imports and entries to `src/theme/MDXComponents.js`**

Add at the top:

```js
import { TagChips } from '@site/src/components/key-features/TagChips';
import { RelatedConcepts } from '@site/src/components/key-features/RelatedConcepts';
```

In the default-export object, add two new keys:

```js
TagChips,
RelatedConcepts,
```

Preserve all existing entries.

- [ ] **Step 3: Verify in dev**

Add a temporary test file `key-features-docs/glossary/_smoke-mdx.md`:

```markdown
---
slug: _smoke-mdx
title: Smoke MDX
tags: [search, algorithm]
---

# Smoke MDX

<TagChips />

<RelatedConcepts ids={['nonexistent']} />

End.
```

Run `yarn start`, navigate to `/why-doris/key-features/glossary/_smoke-mdx`. Expected: page renders, `<TagChips />` shows two chips ("Search", "Algorithm"), `<RelatedConcepts />` renders nothing (graceful — plugin not yet built).

Delete the smoke file after verification:

```bash
rm key-features-docs/glossary/_smoke-mdx.md
```

- [ ] **Step 4: Commit**

```bash
git add src/theme/MDXComponents.js
git commit -m "feat(key-features): register TagChips and RelatedConcepts as global MDX components"
```

---

## Phase 2: Custom Plugin (Glossary Index Aggregator)

### Task 2.1: Write the plugin with TDD

**Files:**
- Create: `plugins/key-features-glossary-index/index.js`
- Create: `plugins/key-features-glossary-index/__tests__/index.test.js`
- Create: `plugins/key-features-glossary-index/__fixtures__/valid-entry.md`
- Create: `plugins/key-features-glossary-index/__fixtures__/minimal-entry.md`
- Create: `plugins/key-features-glossary-index/__fixtures__/no-frontmatter.md`

- [ ] **Step 1: Create test fixtures**

`plugins/key-features-glossary-index/__fixtures__/valid-entry.md`:

```markdown
---
slug: bm25
title: BM25
summary: Probabilistic ranking function for full-text relevance scoring.
tags: [search, indexing, algorithm]
---

# BM25

Body content.
```

`plugins/key-features-glossary-index/__fixtures__/minimal-entry.md`:

```markdown
---
title: Minimal
---

Body.
```

`plugins/key-features-glossary-index/__fixtures__/no-frontmatter.md`:

```markdown
# Just a heading

Body.
```

- [ ] **Step 2: Write the failing test**

`plugins/key-features-glossary-index/__tests__/index.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { parseEntry } = require('../index');

const FIXTURES = path.join(__dirname, '..', '__fixtures__');

test('parseEntry: full frontmatter', () => {
    const entry = parseEntry(path.join(FIXTURES, 'valid-entry.md'));
    assert.deepEqual(entry, {
        slug: 'bm25',
        title: 'BM25',
        summary: 'Probabilistic ranking function for full-text relevance scoring.',
        tags: ['search', 'indexing', 'algorithm'],
    });
});

test('parseEntry: minimal frontmatter falls back to filename slug, empty tags', () => {
    const entry = parseEntry(path.join(FIXTURES, 'minimal-entry.md'));
    assert.deepEqual(entry, {
        slug: 'minimal-entry',
        title: 'Minimal',
        summary: undefined,
        tags: [],
    });
});

test('parseEntry: no frontmatter returns null (skipped)', () => {
    const entry = parseEntry(path.join(FIXTURES, 'no-frontmatter.md'));
    assert.equal(entry, null);
});
```

- [ ] **Step 3: Run test, verify it fails**

Run:

```bash
node --test plugins/key-features-glossary-index/__tests__/index.test.js
```

Expected: FAIL with `Cannot find module '../index'`.

- [ ] **Step 4: Implement the plugin**

`plugins/key-features-glossary-index/index.js`:

```js
const fs = require('node:fs');
const path = require('node:path');
const glob = require('glob');             // glob@7 default-exports a callback function with .sync
const matter = require('gray-matter');

function parseEntry(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    if (!parsed.data || Object.keys(parsed.data).length === 0) {
        return null;
    }
    const fm = parsed.data;
    return {
        slug: fm.slug || path.basename(filePath, path.extname(filePath)),
        title: fm.title,
        summary: fm.summary,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
    };
}

function plugin(context) {
    const glossaryDir = path.join(context.siteDir, 'key-features-docs', 'glossary');

    return {
        name: 'key-features-glossary-index',

        getPathsToWatch() {
            return [path.join(glossaryDir, '**/*.md')];
        },

        async loadContent() {
            if (!fs.existsSync(glossaryDir)) return [];
            // glob@7 is callback-only; .sync returns an array synchronously.
            // This matches the spec sketch (§6.3) and is what the repo actually has installed.
            const files = glob.sync(path.join(glossaryDir, '*.md'));
            return files
                .map(parseEntry)
                .filter(entry => entry !== null && entry.title);
        },

        async contentLoaded({ content, actions }) {
            const sorted = [...content].sort((a, b) => a.title.localeCompare(b.title));
            actions.setGlobalData({ entries: sorted });
        },
    };
}

module.exports = plugin;
module.exports.parseEntry = parseEntry;
```

**Note**: The repo has `glob@7.2.3` installed (callback-only API with a `.sync()` helper). Do not write `await glob(...)` — that pattern only works with `glob@10+` and will fail at build time with v7.

- [ ] **Step 5: Run test, verify it passes**

Run:

```bash
node --test plugins/key-features-glossary-index/__tests__/index.test.js
```

Expected: 3 tests passed.

- [ ] **Step 6: Register the plugin in `docusaurus.config.js`**

In the `plugins:` array, after the `key-features` content-docs entry from Task 0.1, add:

```js
require.resolve('./plugins/key-features-glossary-index'),
```

- [ ] **Step 7: Verify globalData in dev**

Run `yarn start`. Open browser devtools. In the page console, run:

```js
fetch('/__docusaurus/debug/globalData').then(r=>r.json()).then(d => console.log(d['key-features-glossary-index']))
```

Or simpler: temporarily edit the placeholder landing page to call `useAllPluginInstancesData('key-features-glossary-index')` and `console.log` the result. Confirm the entries array is present (empty until Phase 5 seeds content).

- [ ] **Step 8: Commit**

```bash
git add plugins/key-features-glossary-index/ docusaurus.config.js
git commit -m "feat(key-features): add glossary index aggregator plugin"
```

---

## Phase 3: Landing Page

### Task 3.1: Create card config + types

**Files:**
- Create: `src/data/key-features.config.ts`

- [ ] **Step 1: Create the config**

`src/data/key-features.config.ts`:

```ts
export interface FeatureCard {
    slug: string;          // matches the markdown filename in key-features-docs/features/<slug>.md
                           // resolves to /why-doris/key-features/features/<slug>
    title: string;
    tagline: string;
    bullets: string[];
    icon: string;
    featured?: boolean;
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
    {
        slug: 'lakehouse',
        title: 'Lakehouse',
        tagline: 'Query Iceberg, Hudi, and Paimon directly',
        bullets: [
            'Multi-catalog federation',
            'Open table format support',
            'Predicate pushdown to object storage',
            'No ETL needed',
        ],
        icon: '/images/key-features/lakehouse.svg',
        featured: true,
    },
    {
        slug: 'materialized-view',
        title: 'Async Materialized Views',
        tagline: 'Precompute, transparently rewrite',
        bullets: [
            'Incremental refresh',
            'Transparent query rewrite',
            'Multi-table joins supported',
        ],
        icon: '/images/key-features/materialized-view.svg',
    },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/data/key-features.config.ts
git commit -m "feat(key-features): add KEY_FEATURES card config with seed entries"
```

---

### Task 3.2: Build `KeyFeaturesHero`

**Files:**
- Create: `src/components/key-features/KeyFeaturesHero.tsx`
- Create: `src/components/key-features/KeyFeaturesHero.module.scss`

- [ ] **Step 1: Implement the hero**

The structural pattern mirrors `src/components/use-cases-next/CustomerFacingAnalyticsNext.tsx`'s `Hero` (lines 490–517): a single section with one title and one subtitle. No pillar tags, no CTAs. Visual identity is dark/engineer (per spec §4.1), separate from the marketing tone of the use-cases pages.

`src/components/key-features/KeyFeaturesHero.tsx`:

```tsx
import React, { JSX } from 'react';
import styles from './KeyFeaturesHero.module.scss';

export function KeyFeaturesHero(): JSX.Element {
    return (
        <section className={styles.hero}>
            <div className={styles.inner}>
                <h1 className={styles.title}>
                    Apache Doris is a real-time analytical database<br />
                    built for hybrid workloads.
                </h1>
                <p className={styles.subtitle}>
                    A unified engine for hybrid search, lakehouse, and high-concurrency analytics.
                </p>
            </div>
        </section>
    );
}
```

`src/components/key-features/KeyFeaturesHero.module.scss`:

```scss
.hero {
    background: #0b1020;
    color: #e2e8f0;
    padding: 5rem 1.5rem 4rem;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px);
        background-size: 40px 40px;
        pointer-events: none;
    }
}

.inner {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
}

.title {
    font-size: clamp(1.75rem, 4vw, 3rem);
    font-weight: 700;
    line-height: 1.15;
    margin: 0 0 1rem;
    color: #f8fafc;
}

.subtitle {
    font-size: clamp(1rem, 1.5vw, 1.125rem);
    line-height: 1.5;
    margin: 0;
    max-width: 720px;
    color: #94a3b8;
}

@media (max-width: 640px) {
    .hero { padding: 3rem 1.25rem; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/key-features/KeyFeaturesHero.tsx src/components/key-features/KeyFeaturesHero.module.scss
git commit -m "feat(key-features): add hero component"
```

---

### Task 3.3: Build `FeatureCard` and `FeatureCardGrid`

**Files:**
- Create: `src/components/key-features/FeatureCard.tsx`
- Create: `src/components/key-features/FeatureCard.module.scss`
- Create: `src/components/key-features/FeatureCardGrid.tsx`
- Create: `src/components/key-features/FeatureCardGrid.module.scss`

- [ ] **Step 1: Implement `FeatureCard`**

`src/components/key-features/FeatureCard.tsx`:

```tsx
import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import type { FeatureCard as FeatureCardType } from '@site/src/data/key-features.config';
import styles from './FeatureCard.module.scss';

interface FeatureCardProps {
    card: FeatureCardType;
}

export function FeatureCard({ card }: FeatureCardProps): JSX.Element {
    const className = [styles.card, card.featured ? styles.featured : ''].filter(Boolean).join(' ');
    return (
        <Link to={`/why-doris/key-features/features/${card.slug}`} className={className}>
            <div className={styles.iconWrap}>
                <img src={card.icon} alt="" className={styles.icon} aria-hidden="true" />
            </div>
            <h3 className={styles.title}>{card.title}</h3>
            <p className={styles.tagline}>{card.tagline}</p>
            <ul className={styles.bullets}>
                {card.bullets.map(b => <li key={b}>{b}</li>)}
            </ul>
            <span className={styles.arrow} aria-hidden="true">→</span>
        </Link>
    );
}
```

`src/components/key-features/FeatureCard.module.scss`:

```scss
.card {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border: 1px solid var(--ifm-color-emphasis-200);
    border-radius: 12px;
    background: var(--ifm-background-color);
    color: var(--ifm-color-emphasis-900);
    text-decoration: none;
    position: relative;
    transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;

    &:hover {
        border-color: var(--ifm-color-primary);
        text-decoration: none;
        color: var(--ifm-color-emphasis-900);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px -8px rgba(0,0,0,0.12);
    }
}

.featured {
    background: linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.04));
}

.iconWrap {
    width: 40px; height: 40px;
    margin-bottom: 1rem;
}
.icon { width: 100%; height: 100%; }

.title {
    font-size: 1.25rem;
    margin: 0 0 0.5rem;
}

.tagline {
    font-size: 0.95rem;
    color: var(--ifm-color-emphasis-700);
    margin: 0 0 1rem;
    font-family: var(--ifm-font-family-monospace, monospace);
}

.bullets {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    font-size: 0.875rem;
    color: var(--ifm-color-emphasis-800);

    li {
        padding: 0.125rem 0 0.125rem 1rem;
        position: relative;
        &::before {
            content: '·';
            position: absolute;
            left: 0.25rem;
            color: var(--ifm-color-primary);
        }
    }
}

.arrow {
    margin-top: auto;
    font-size: 1.25rem;
    color: var(--ifm-color-primary);
    align-self: flex-end;
}

@media (max-width: 640px) {
    .featured {
        padding: 1.75rem;
        .iconWrap { width: 56px; height: 56px; }
    }
}
```

- [ ] **Step 2: Implement `FeatureCardGrid`**

`src/components/key-features/FeatureCardGrid.tsx`:

```tsx
import React, { JSX } from 'react';
import { KEY_FEATURES } from '@site/src/data/key-features.config';
import { FeatureCard } from './FeatureCard';
import styles from './FeatureCardGrid.module.scss';

export function FeatureCardGrid(): JSX.Element {
    return (
        <section className={styles.gridSection}>
            <div className={styles.grid}>
                {KEY_FEATURES.map(card => (
                    <div
                        key={card.slug}
                        className={card.featured ? styles.cellFeatured : styles.cell}
                    >
                        <FeatureCard card={card} />
                    </div>
                ))}
            </div>
        </section>
    );
}
```

`src/components/key-features/FeatureCardGrid.module.scss`:

```scss
.gridSection {
    padding: 4rem 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
}

.grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
}

.cell { grid-column: span 4; }
.cellFeatured { grid-column: span 8; }

.cell > a, .cellFeatured > a { height: 100%; }

@media (max-width: 996px) {
    .grid { grid-template-columns: repeat(6, 1fr); gap: 1rem; }
    .cell, .cellFeatured { grid-column: span 6; }
}

@media (max-width: 640px) {
    .gridSection { padding: 2.5rem 1rem; }
    .grid { grid-template-columns: 1fr; }
    .cell, .cellFeatured { grid-column: span 1; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/key-features/FeatureCard.tsx src/components/key-features/FeatureCard.module.scss src/components/key-features/FeatureCardGrid.tsx src/components/key-features/FeatureCardGrid.module.scss
git commit -m "feat(key-features): add FeatureCard and FeatureCardGrid"
```

---

### Task 3.4: Build `GlossaryCTABanner`

**Files:**
- Create: `src/components/key-features/GlossaryCTABanner.tsx`
- Create: `src/components/key-features/GlossaryCTABanner.module.scss`

- [ ] **Step 1: Implement the banner**

`src/components/key-features/GlossaryCTABanner.tsx`:

```tsx
import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import { useAllPluginInstancesData } from '@docusaurus/useGlobalData';
import styles from './GlossaryCTABanner.module.scss';

const GLOSSARY_PLUGIN_ID = 'key-features-glossary-index';

export function GlossaryCTABanner(): JSX.Element {
    const all = useAllPluginInstancesData(GLOSSARY_PLUGIN_ID);
    const data = all?.default as { entries?: unknown[] } | undefined;
    const count = data?.entries?.length ?? 0;

    return (
        <section className={styles.banner}>
            <div className={styles.inner}>
                <div>
                    <h2 className={styles.heading}>Concept Glossary</h2>
                    <p className={styles.subheading}>
                        Need to look up a specific technique? <strong>{count}</strong> concepts indexed and growing.
                    </p>
                </div>
                <Link to="/why-doris/key-features/glossary" className={styles.cta}>
                    Browse Concept Glossary →
                </Link>
            </div>
        </section>
    );
}
```

`src/components/key-features/GlossaryCTABanner.module.scss`:

```scss
.banner {
    background: #0b1020;
    color: #e2e8f0;
    padding: 3rem 1.5rem;
}

.inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
}

.heading {
    font-size: 1.5rem;
    margin: 0 0 0.5rem;
    color: #f8fafc;
}

.subheading {
    margin: 0;
    color: #94a3b8;
    strong { color: #f8fafc; font-family: var(--ifm-font-family-monospace, monospace); }
}

.cta {
    background: #6366f1;
    color: #fff;
    padding: 0.625rem 1.25rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    white-space: nowrap;

    &:hover { background: #4f46e5; color: #fff; text-decoration: none; }
}

@media (max-width: 640px) {
    .inner { flex-direction: column; align-items: stretch; }
    .cta { text-align: center; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/key-features/GlossaryCTABanner.tsx src/components/key-features/GlossaryCTABanner.module.scss
git commit -m "feat(key-features): add GlossaryCTABanner"
```

---

### Task 3.5: Assemble the landing page

**Files:**
- Modify: `src/pages/why-doris/key-features/index.tsx` (replace placeholder)
- Create: `src/pages/why-doris/key-features/index.module.scss`

- [ ] **Step 1: Replace the placeholder**

`src/pages/why-doris/key-features/index.tsx`:

```tsx
import React, { JSX } from 'react';
import Layout from '@theme/Layout';
import { KeyFeaturesHero } from '@site/src/components/key-features/KeyFeaturesHero';
import { FeatureCardGrid } from '@site/src/components/key-features/FeatureCardGrid';
import { GlossaryCTABanner } from '@site/src/components/key-features/GlossaryCTABanner';

export default function KeyFeaturesLanding(): JSX.Element {
    return (
        <Layout
            title="Key Features"
            description="Apache Doris's distinctive technical capabilities for engineers."
        >
            <KeyFeaturesHero />
            <FeatureCardGrid />
            <GlossaryCTABanner />
        </Layout>
    );
}
```

- [ ] **Step 2: Add placeholder icons**

Create three placeholder SVGs (use the same generic icon for all three until brand provides finals):

`static/images/key-features/hybrid-search.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <circle cx="20" cy="20" r="18" stroke="#6366f1" stroke-width="2"/>
  <path d="M14 20l4 4 8-8" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

Copy this file to `lakehouse.svg` and `materialized-view.svg`. Final brand SVGs come later.

- [ ] **Step 3: Visual verify**

Run `yarn start` and open `http://localhost:3000/why-doris/key-features`. Confirm:

- Hero renders with dark background and grid pattern
- Three cards visible: Hybrid Search and Lakehouse are wider (featured), Async Materialized Views narrower
- Cards link correctly (will 404 — that's fine until Phase 5)
- CTA banner shows "0 concepts" until glossary entries are added
- Resize to < 640px: stacks correctly to single column

- [ ] **Step 4: Commit**

```bash
git add src/pages/why-doris/key-features/index.tsx static/images/key-features/
git commit -m "feat(key-features): assemble landing page"
```

---

### Task 3.6: Wire navbar entry

**Files:**
- Modify: `src/components/home-next/NavbarNext.tsx:38`

- [ ] **Step 1: Update the navbar item**

In `src/components/home-next/NavbarNext.tsx`, line 38:

```diff
- { label: 'Key Features (coming soon)', href: '#' },
+ { label: 'Key Features', href: '/why-doris/key-features' },
```

- [ ] **Step 2: Verify in dev**

`yarn start` → click "Why Doris" dropdown → click "Key Features" → confirm it lands on the new page.

- [ ] **Step 3: Commit**

```bash
git add src/components/home-next/NavbarNext.tsx
git commit -m "feat(key-features): wire navbar entry to landing page"
```

---

## Phase 4: Glossary Index Page

### Task 4.1: Build `useGlossaryFilters` hook with TDD

**Files:**
- Create: `src/components/key-features/useGlossaryFilters.ts`
- Create: `src/components/key-features/__tests__/useGlossaryFilters.test.ts`

The hook is responsible for: maintaining active tag selection, applying OR-within-group/AND-across-groups filtering, applying title search, and syncing state to the URL query string.

- [ ] **Step 1: Decide on filter-module language**

The pure filter logic ships as a plain `.js` file (no TypeScript) so that `node:test` can require it directly without a compile step — same pattern the project's existing `scripts/docs-governance/__tests__/*.test.js` uses. The React hook on top stays `.ts`. Types are exposed via a sibling `.d.ts` declaration file.

- [ ] **Step 2: Write the filter module + types**

Create `src/components/key-features/glossaryFilter.js`:

```js
const { getTagGroup } = require('@site/src/utils/key-features-tags');

function applyFilter(entries, activeTags, searchQuery) {
    const query = searchQuery.trim().toLowerCase();

    // Group active tags by their group id (tags not in registry are dropped here)
    const tagsByGroup = new Map();
    for (const tag of activeTags) {
        const groupId = getTagGroup(tag);
        if (!groupId) continue;
        if (!tagsByGroup.has(groupId)) tagsByGroup.set(groupId, new Set());
        tagsByGroup.get(groupId).add(tag);
    }

    return entries.filter(entry => {
        if (query && !entry.title.toLowerCase().startsWith(query)) return false;

        // OR within group, AND across groups
        for (const tagsInGroup of tagsByGroup.values()) {
            const matchesAny = entry.tags.some(t => tagsInGroup.has(t));
            if (!matchesAny) return false;
        }
        return true;
    });
}

module.exports = { applyFilter };
```

Create the type declaration `src/components/key-features/glossaryFilter.d.ts`:

```ts
export interface GlossaryEntry {
    slug: string;
    title: string;
    summary?: string;
    tags: string[];
}

export function applyFilter(
    entries: GlossaryEntry[],
    activeTags: string[],
    searchQuery: string,
): GlossaryEntry[];
```

This gives the hook (`useGlossaryFilters.ts`) full TypeScript type-checking when it imports from `./glossaryFilter`, while letting the test file `require('../glossaryFilter')` directly with no build step.

The webpack runtime resolves the bare `import` from TS to the `.js` file naturally; no config change needed.

- [ ] **Step 3: Write the failing test**

Create `src/components/key-features/__tests__/glossaryFilter.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

// Mock the @site/... alias before requiring the filter module.
// The test runs in raw Node (no webpack), so the alias must be intercepted at require time.
const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
    if (request === '@site/src/utils/key-features-tags') {
        return require.resolve('./_mock-tags.js');
    }
    return originalResolve.call(this, request, ...rest);
};

const { applyFilter } = require('../glossaryFilter');

const ENTRIES = [
    { slug: 'bm25', title: 'BM25', tags: ['search', 'indexing', 'algorithm'] },
    { slug: 'iceberg', title: 'Iceberg', tags: ['lakehouse', 'file-format'] },
    { slug: 'ann-search', title: 'ANN Search', tags: ['search', 'algorithm'] },
    { slug: 'inverted-index', title: 'Inverted Index', tags: ['indexing', 'data-structure'] },
];

test('no filters returns all entries', () => {
    assert.equal(applyFilter(ENTRIES, [], '').length, 4);
});

test('single tag filters by that tag', () => {
    const result = applyFilter(ENTRIES, ['search'], '');
    assert.deepEqual(result.map(e => e.slug), ['bm25', 'ann-search']);
});

test('two tags in same group OR together', () => {
    const result = applyFilter(ENTRIES, ['search', 'indexing'], '');
    assert.deepEqual(result.map(e => e.slug), ['bm25', 'ann-search', 'inverted-index']);
});

test('tags across groups AND together', () => {
    // (search OR indexing) AND (algorithm)
    const result = applyFilter(ENTRIES, ['search', 'indexing', 'algorithm'], '');
    assert.deepEqual(result.map(e => e.slug), ['bm25', 'ann-search']);
});

test('search matches title startsWith case-insensitive', () => {
    const result = applyFilter(ENTRIES, [], 'ann');
    assert.deepEqual(result.map(e => e.slug), ['ann-search']);
});

test('search combines with tags via AND', () => {
    const result = applyFilter(ENTRIES, ['indexing'], 'bm');
    assert.deepEqual(result.map(e => e.slug), ['bm25']);
});

test('unregistered tag is silently dropped (does not constrain results)', () => {
    const result = applyFilter(ENTRIES, ['search', 'nonexistent-tag'], '');
    // 'nonexistent-tag' has no group → dropped → behaves as if only 'search' was active
    assert.deepEqual(result.map(e => e.slug), ['bm25', 'ann-search']);
});
```

Create the mock at `src/components/key-features/__tests__/_mock-tags.js`:

```js
const groups = {
    'functional-area': new Set(['search', 'indexing', 'lakehouse']),
    'concept-type': new Set(['algorithm', 'data-structure', 'file-format']),
};

module.exports = {
    getTagGroup(tagId) {
        for (const [groupId, set] of Object.entries(groups)) {
            if (set.has(tagId)) return groupId;
        }
        return null;
    },
};
```

**However**, the filter module imports from `@site/src/utils/key-features-tags` — which itself imports a YAML/TS data registry. To keep the test pure-Node, the helper utility needs to be require-able from Node. The simplest approach: extract the `getTagGroup` lookup into a small `.js` module that the React utility delegates to, OR — easier — write the test mock to fully replace the utility (as shown above with `Module._resolveFilename`). That mock IS the strategy.

Run the test and confirm it fails because `glossaryFilter.js` does not yet exist:

```bash
node --test src/components/key-features/__tests__/glossaryFilter.test.js
```

Expected: FAIL with `Cannot find module '../glossaryFilter'`.

Now create `glossaryFilter.js` per Step 2 above. Re-run the test.

- [ ] **Step 4: Verify all 7 tests pass**

```bash
node --test src/components/key-features/__tests__/glossaryFilter.test.js
```

Expected: 7 tests passed.

- [ ] **Step 5: Build the React hook on top of the pure function**

`src/components/key-features/useGlossaryFilters.ts`:

```ts
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import { applyFilter } from './glossaryFilter';
import type { GlossaryEntry } from './glossaryFilter';

const TAG_QUERY_KEY = 'tag';

function parseTagsFromUrl(search: string): string[] {
    const params = new URLSearchParams(search);
    const raw = params.get(TAG_QUERY_KEY);
    if (!raw) return [];
    return Array.from(new Set(raw.split(',').filter(Boolean)));
}

function buildUrlSearch(currentSearch: string, tags: string[]): string {
    const params = new URLSearchParams(currentSearch);
    if (tags.length === 0) {
        params.delete(TAG_QUERY_KEY);
    } else {
        params.set(TAG_QUERY_KEY, tags.join(','));
    }
    const out = params.toString();
    return out ? `?${out}` : '';
}

export function useGlossaryFilters(entries: GlossaryEntry[]) {
    const history = useHistory();
    const location = useLocation();

    const [activeTags, setActiveTags] = useState<string[]>(() => parseTagsFromUrl(location.search));
    const [searchQuery, setSearchQuery] = useState('');

    // Keep state in sync with back/forward navigation
    useEffect(() => {
        const fromUrl = parseTagsFromUrl(location.search);
        setActiveTags(prev => {
            if (prev.length === fromUrl.length && prev.every(t => fromUrl.includes(t))) return prev;
            return fromUrl;
        });
    }, [location.search]);

    // Push state changes to URL
    const commitTags = useCallback((next: string[]) => {
        setActiveTags(next);
        const newSearch = buildUrlSearch(location.search, next);
        if (newSearch !== location.search) {
            history.replace({ ...location, search: newSearch });
        }
    }, [history, location]);

    const toggleTag = useCallback((tagId: string) => {
        commitTags(
            activeTags.includes(tagId)
                ? activeTags.filter(t => t !== tagId)
                : [...activeTags, tagId]
        );
    }, [activeTags, commitTags]);

    const clearTags = useCallback(() => commitTags([]), [commitTags]);

    const filtered = useMemo(
        () => applyFilter(entries, activeTags, searchQuery),
        [entries, activeTags, searchQuery]
    );

    return {
        activeTags,
        searchQuery,
        setSearchQuery,
        toggleTag,
        clearTags,
        filtered,
    };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/key-features/glossaryFilter.js src/components/key-features/glossaryFilter.d.ts src/components/key-features/useGlossaryFilters.ts src/components/key-features/__tests__/
git commit -m "feat(key-features): add filter logic and useGlossaryFilters hook"
```

---

### Task 4.2: Build `GlossaryFilterBar` (desktop)

**Files:**
- Create: `src/components/key-features/GlossaryFilterBar.tsx`
- Create: `src/components/key-features/GlossaryFilterBar.module.scss`

- [ ] **Step 1: Implement the bar**

`src/components/key-features/GlossaryFilterBar.tsx`:

```tsx
import React, { JSX } from 'react';
import { listTagGroups } from '@site/src/utils/key-features-tags';
import { TagChip } from './TagChip';
import styles from './GlossaryFilterBar.module.scss';

interface Props {
    activeTags: string[];
    onToggle: (tagId: string) => void;
    onClear: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export function GlossaryFilterBar({
    activeTags, onToggle, onClear, searchQuery, onSearchChange,
}: Props): JSX.Element {
    const groups = listTagGroups();
    const activeSet = new Set(activeTags);

    return (
        <div className={styles.bar}>
            <input
                type="search"
                className={styles.search}
                placeholder="Search by title..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                aria-label="Search glossary by title"
            />

            {groups.map(group => (
                <div key={group.id} className={styles.group}>
                    <span className={styles.groupLabel}>{group.label}:</span>
                    <div className={styles.chipRow}>
                        {group.tagIds.map(tagId => (
                            <TagChip
                                key={tagId}
                                tagId={tagId}
                                onClick={() => onToggle(tagId)}
                                active={activeSet.has(tagId)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {activeTags.length > 0 && (
                <button type="button" className={styles.clear} onClick={onClear}>
                    Clear all ({activeTags.length})
                </button>
            )}
        </div>
    );
}
```

`src/components/key-features/GlossaryFilterBar.module.scss`:

```scss
.bar {
    position: sticky;
    top: var(--ifm-navbar-height);
    z-index: 10;
    background: var(--ifm-background-color);
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--ifm-color-emphasis-200);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 1200px;
    margin: 0 auto;
}

.search {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--ifm-color-emphasis-300);
    border-radius: 6px;
    font-size: 0.95rem;
    background: var(--ifm-background-color);
    color: var(--ifm-color-emphasis-900);

    &:focus {
        outline: none;
        border-color: var(--ifm-color-primary);
    }
}

.group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.groupLabel {
    font-size: 0.875rem;
    color: var(--ifm-color-emphasis-700);
    font-family: var(--ifm-font-family-monospace, monospace);
    min-width: 8rem;
}

.chipRow {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
}

.clear {
    align-self: flex-start;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--ifm-color-emphasis-300);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--ifm-color-emphasis-800);

    &:hover { border-color: var(--ifm-color-primary); color: var(--ifm-color-primary); }
}

@media (max-width: 640px) {
    .bar { display: none; }  // mobile uses GlossaryFilterSheet instead
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/key-features/GlossaryFilterBar.tsx src/components/key-features/GlossaryFilterBar.module.scss
git commit -m "feat(key-features): add desktop GlossaryFilterBar"
```

---

### Task 4.3: Build `GlossaryFilterSheet` (mobile)

**Files:**
- Create: `src/components/key-features/GlossaryFilterSheet.tsx`
- Create: `src/components/key-features/GlossaryFilterSheet.module.scss`

- [ ] **Step 1: Implement the sheet**

`src/components/key-features/GlossaryFilterSheet.tsx`:

```tsx
import React, { JSX, useEffect, useState } from 'react';
import { listTagGroups } from '@site/src/utils/key-features-tags';
import { TagChip } from './TagChip';
import styles from './GlossaryFilterSheet.module.scss';

interface Props {
    activeTags: string[];
    onToggle: (tagId: string) => void;
    onClear: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    matchCount: number;
}

export function GlossaryFilterSheet({
    activeTags, onToggle, onClear, searchQuery, onSearchChange, matchCount,
}: Props): JSX.Element {
    const [open, setOpen] = useState(false);
    const groups = listTagGroups();
    const activeSet = new Set(activeTags);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [open]);

    return (
        <div className={styles.sheetTrigger}>
            <input
                type="search"
                className={styles.search}
                placeholder="Search by title..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                aria-label="Search glossary by title"
            />

            <div className={styles.controlRow}>
                <button type="button" className={styles.openBtn} onClick={() => setOpen(true)}>
                    ⚙ Filter{activeTags.length > 0 ? ` (${activeTags.length})` : ''}
                </button>
                {activeTags.length > 0 && (
                    <button type="button" className={styles.clearInline} onClick={onClear}>Clear</button>
                )}
            </div>

            {activeTags.length > 0 && (
                <p className={styles.activeSummary}>
                    Active: {activeTags.join(', ')}
                </p>
            )}

            {open && (
                <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Filter">
                    <div className={styles.sheet}>
                        <div className={styles.sheetHeader}>
                            <span>Filter</span>
                            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close">✕</button>
                        </div>
                        <div className={styles.sheetBody}>
                            {groups.map(group => (
                                <div key={group.id} className={styles.group}>
                                    <h4 className={styles.groupLabel}>{group.label}</h4>
                                    <div className={styles.chipRow}>
                                        {group.tagIds.map(tagId => (
                                            <TagChip
                                                key={tagId}
                                                tagId={tagId}
                                                onClick={() => onToggle(tagId)}
                                                active={activeSet.has(tagId)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.sheetFooter}>
                            <button type="button" className={styles.clearBtn} onClick={onClear}>Clear all</button>
                            <button type="button" className={styles.applyBtn} onClick={() => setOpen(false)}>
                                Apply ({matchCount})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
```

`src/components/key-features/GlossaryFilterSheet.module.scss`:

```scss
.sheetTrigger {
    display: none;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    position: sticky;
    top: var(--ifm-navbar-height);
    background: var(--ifm-background-color);
    border-bottom: 1px solid var(--ifm-color-emphasis-200);
    z-index: 10;
}

.search {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--ifm-color-emphasis-300);
    border-radius: 6px;
}

.controlRow {
    display: flex;
    gap: 0.5rem;
}

.openBtn, .clearInline {
    padding: 0.5rem 0.875rem;
    border: 1px solid var(--ifm-color-emphasis-300);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
}

.activeSummary {
    margin: 0;
    font-size: 0.8rem;
    color: var(--ifm-color-emphasis-700);
}

.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 100;
    display: flex;
    align-items: flex-end;
}

.sheet {
    background: var(--ifm-background-color);
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    border-radius: 16px 16px 0 0;
    animation: slideUp 0.2s ease;
}

@keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}

.sheetHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--ifm-color-emphasis-200);
    font-weight: 600;
}

.close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
}

.sheetBody {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.group { margin-bottom: 1.5rem; }

.groupLabel {
    font-size: 0.875rem;
    color: var(--ifm-color-emphasis-700);
    margin: 0 0 0.5rem;
}

.chipRow {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
}

.sheetFooter {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    border-top: 1px solid var(--ifm-color-emphasis-200);
}

.clearBtn, .applyBtn {
    flex: 1;
    padding: 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

.clearBtn {
    border: 1px solid var(--ifm-color-emphasis-300);
    background: transparent;
}

.applyBtn {
    border: none;
    background: var(--ifm-color-primary);
    color: #fff;
}

@media (max-width: 640px) {
    .sheetTrigger { display: flex; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/key-features/GlossaryFilterSheet.tsx src/components/key-features/GlossaryFilterSheet.module.scss
git commit -m "feat(key-features): add mobile GlossaryFilterSheet"
```

---

### Task 4.4: Build `GlossaryEntryList` (with sticky letter headers)

**Files:**
- Create: `src/components/key-features/GlossaryEntryList.tsx`
- Create: `src/components/key-features/GlossaryEntryList.module.scss`

- [ ] **Step 1: Implement the list**

`src/components/key-features/GlossaryEntryList.tsx`:

```tsx
import React, { JSX, useMemo } from 'react';
import Link from '@docusaurus/Link';
import type { GlossaryEntry } from './glossaryFilter';
import { TagChip } from './TagChip';
import styles from './GlossaryEntryList.module.scss';

interface Props {
    entries: GlossaryEntry[];
}

export function GlossaryEntryList({ entries }: Props): JSX.Element {
    const grouped = useMemo(() => {
        const map = new Map<string, GlossaryEntry[]>();
        for (const entry of entries) {
            const letter = entry.title.charAt(0).toUpperCase();
            const key = /[A-Z]/.test(letter) ? letter : '#';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(entry);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [entries]);

    if (entries.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No concepts match the current filters.</p>
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {grouped.map(([letter, items]) => (
                <section key={letter} className={styles.section}>
                    <h2 className={styles.letter}>{letter}</h2>
                    <ul className={styles.items}>
                        {items.map(entry => (
                            <li key={entry.slug} className={styles.item}>
                                <Link to={`/why-doris/key-features/glossary/${entry.slug}`} className={styles.title}>
                                    {entry.title}
                                </Link>
                                <div className={styles.tagRow}>
                                    {entry.tags.map(t => <TagChip key={t} tagId={t} />)}
                                </div>
                                {entry.summary && <p className={styles.summary}>{entry.summary}</p>}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
```

`src/components/key-features/GlossaryEntryList.module.scss`:

```scss
.list {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
}

.section {
    margin-bottom: 2rem;
}

.letter {
    position: sticky;
    top: calc(var(--ifm-navbar-height) + 4.5rem);  // navbar + filter bar
    background: var(--ifm-background-color);
    padding: 0.5rem 0;
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-family: var(--ifm-font-family-monospace, monospace);
    color: var(--ifm-color-emphasis-700);
    border-bottom: 1px solid var(--ifm-color-emphasis-200);
    z-index: 5;
}

.items {
    list-style: none;
    padding: 0;
    margin: 0;
}

.item {
    padding: 1rem 0;
    border-bottom: 1px solid var(--ifm-color-emphasis-100);

    &:last-child { border-bottom: none; }
}

.title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--ifm-color-emphasis-900);
    text-decoration: none;

    &:hover { color: var(--ifm-color-primary); text-decoration: none; }
}

.tagRow {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin: 0.375rem 0 0.5rem;
}

.summary {
    margin: 0;
    color: var(--ifm-color-emphasis-700);
    font-size: 0.95rem;
}

.empty {
    padding: 3rem 1.5rem;
    text-align: center;
    color: var(--ifm-color-emphasis-600);
}

@media (max-width: 640px) {
    .letter { top: calc(var(--ifm-navbar-height) + 5rem); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/key-features/GlossaryEntryList.tsx src/components/key-features/GlossaryEntryList.module.scss
git commit -m "feat(key-features): add GlossaryEntryList with sticky letter headers"
```

---

### Task 4.5: Assemble glossary index page

**Files:**
- Create: `src/pages/why-doris/key-features/glossary/index.tsx`
- Create: `src/pages/why-doris/key-features/glossary/index.module.scss`

- [ ] **Step 1: Assemble the page**

`src/pages/why-doris/key-features/glossary/index.tsx`:

```tsx
import React, { JSX } from 'react';
import Layout from '@theme/Layout';
import { useAllPluginInstancesData } from '@docusaurus/useGlobalData';
import type { GlossaryEntry } from '@site/src/components/key-features/glossaryFilter';
import { useGlossaryFilters } from '@site/src/components/key-features/useGlossaryFilters';
import { GlossaryFilterBar } from '@site/src/components/key-features/GlossaryFilterBar';
import { GlossaryFilterSheet } from '@site/src/components/key-features/GlossaryFilterSheet';
import { GlossaryEntryList } from '@site/src/components/key-features/GlossaryEntryList';
import styles from './index.module.scss';

const GLOSSARY_PLUGIN_ID = 'key-features-glossary-index';

export default function GlossaryIndex(): JSX.Element {
    const all = useAllPluginInstancesData(GLOSSARY_PLUGIN_ID);
    const data = all?.default as { entries?: GlossaryEntry[] } | undefined;
    const entries = data?.entries ?? [];

    const {
        activeTags, searchQuery, setSearchQuery,
        toggleTag, clearTags, filtered,
    } = useGlossaryFilters(entries);

    return (
        <Layout
            title="Concept Glossary"
            description="Atomic technical concepts used across Apache Doris's features."
        >
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <h1 className={styles.title}>Concept Glossary</h1>
                    <p className={styles.subtitle}>
                        Atomic technical concepts, used and referenced across Doris's features.
                        <strong> {entries.length} entries.</strong>
                    </p>
                </div>
            </header>

            <GlossaryFilterBar
                activeTags={activeTags}
                onToggle={toggleTag}
                onClear={clearTags}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <GlossaryFilterSheet
                activeTags={activeTags}
                onToggle={toggleTag}
                onClear={clearTags}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                matchCount={filtered.length}
            />

            <GlossaryEntryList entries={filtered} />
        </Layout>
    );
}
```

`src/pages/why-doris/key-features/glossary/index.module.scss`:

```scss
.header {
    background: #0b1020;
    color: #e2e8f0;
    padding: 3rem 1.5rem 2.5rem;
}

.headerInner {
    max-width: 1200px;
    margin: 0 auto;
}

.title {
    font-size: 2rem;
    margin: 0 0 0.5rem;
    color: #f8fafc;
}

.subtitle {
    margin: 0;
    color: #94a3b8;

    strong {
        color: #f8fafc;
        font-family: var(--ifm-font-family-monospace, monospace);
    }
}

@media (max-width: 640px) {
    .title { font-size: 1.5rem; }
}
```

- [ ] **Step 2: Visual verify**

Run `yarn start`. Navigate to `/why-doris/key-features/glossary`. Confirm:

- Header shows "Concept Glossary" with "0 entries" (no seed yet)
- Filter bar visible on desktop with all tag chips
- Empty state ("No concepts match...") visible
- Resize to <640px: filter bar disappears, sheet trigger button appears, tap opens bottom sheet

- [ ] **Step 3: Commit**

```bash
git add src/pages/why-doris/key-features/glossary/
git commit -m "feat(key-features): assemble glossary index page"
```

---

## Phase 5: Seed Content

### Task 5.1: Add 2 featured + 1 regular feature article

**Files:**
- Create: `key-features-docs/features/hybrid-search.md`
- Create: `key-features-docs/features/lakehouse.md`
- Create: `key-features-docs/features/materialized-view.md`

- [ ] **Step 1: Hybrid Search article**

`key-features-docs/features/hybrid-search.md`:

```markdown
---
slug: hybrid-search
title: Hybrid Search
summary: Unified vector + full-text + scalar search in one engine.
related_concepts:
  - bm25
  - inverted-index
  - ann-search
---

# Hybrid Search

## What it solves

Modern applications need to combine three signals at query time: semantic similarity (vector search), keyword relevance (full-text), and traditional filters (scalar predicates). Most engines force a tradeoff — a vector database that can't filter by SQL, a search engine that can't do JOINs, or a data warehouse that can't rank by similarity. Doris brings all three into a single SQL surface.

## How it works

Doris stores vectors as a native type, with HNSW indexes for approximate nearest-neighbor search. The same table can also carry an inverted index for full-text columns and standard column-store indexes for scalar fields. A single SQL query can combine all three predicates, with the planner choosing pushdown order based on selectivity.

The relevance scoring stack supports BM25 for full-text, cosine/L2 distance for vectors, and arbitrary SQL expressions for re-ranking. Hybrid scoring across modalities is expressed declaratively rather than via custom code.

## When to use it

Pick Doris over a specialized vector DB when your retrieval pipeline already needs SQL filters, joins, or aggregations. Pick it over a pure search engine when you need stronger consistency, transactional updates, or analytical queries on the same data.

<RelatedConcepts />
```

- [ ] **Step 2: Lakehouse article**

`key-features-docs/features/lakehouse.md`:

```markdown
---
slug: lakehouse
title: Lakehouse
summary: Query Iceberg, Hudi, and Paimon directly without ETL.
related_concepts:
  - iceberg
  - hudi
---

# Lakehouse

## What it solves

The "lakehouse" idea promises one storage layer that serves both analytical and operational workloads. In practice it requires three things: open table formats, compute that reads them at native speed, and federation across the catalogs your organization already uses. Doris provides all three as first-class capabilities — not bolt-on connectors.

## How it works

Doris reads Iceberg, Hudi, and Paimon tables directly from object storage. Catalog federation lets a single SQL query span Hive Metastore, AWS Glue, and Iceberg REST catalogs without staging data. Predicate pushdown reaches into Parquet and ORC scan layers; partition pruning and statistics-driven file skipping keep wide-table scans bounded.

For incremental workloads, Doris materializes hot subsets into native tables while leaving the cold tail on the lake. The same query planner decides at runtime which path to take.

## When to use it

Choose this when your data already lives in an open table format and you want analytical SQL without copying it. Especially valuable when you have multiple teams reading from different catalogs.

<RelatedConcepts />
```

- [ ] **Step 3: Async Materialized Views article**

`key-features-docs/features/materialized-view.md`:

```markdown
---
slug: materialized-view
title: Async Materialized Views
summary: Precompute results, transparently rewrite queries.
related_concepts:
  - async-materialized-view
---

# Async Materialized Views

## What it solves

Dashboards and APIs frequently re-issue the same aggregations over the same data. Caching at the application layer is brittle (invalidation is hard) and pre-aggregating into separate tables forces the application to know which table to query. Async materialized views (AMVs) solve both.

## How it works

You declare an AMV as a SQL definition. Doris maintains it asynchronously — refreshes are scheduled, not synchronous on the base table write — so writes stay fast. At query time, the optimizer recognizes that an AMV can serve a query and rewrites the plan to use it transparently. The application keeps writing the same SQL.

Refresh strategies span full refresh, incremental refresh on partitioned base tables, and triggered refresh based on freshness SLAs.

## When to use it

Use AMVs when you have an expensive query that runs often enough to amortize the maintenance cost. The transparent rewrite means you don't have to coordinate application changes with view changes.

<RelatedConcepts />
```

- [ ] **Step 4: Visual verify**

`yarn start`. Navigate to:

- `/why-doris/key-features/features/hybrid-search` → renders with breadcrumbs, TOC, "Related concepts" section at the bottom (will show only entries that exist in glossary; some will be missing until Task 5.2 completes — graceful)
- `/why-doris/key-features/features/lakehouse` → same
- `/why-doris/key-features/features/materialized-view` → same

From the landing page, click each card to confirm navigation works.

- [ ] **Step 5: Commit**

```bash
git add key-features-docs/features/
git commit -m "feat(key-features): seed 3 feature articles"
```

---

### Task 5.2: Add 7 seed glossary entries

**Files:**
- Create: `key-features-docs/glossary/bm25.md`
- Create: `key-features-docs/glossary/inverted-index.md`
- Create: `key-features-docs/glossary/ann-search.md`
- Create: `key-features-docs/glossary/iceberg.md`
- Create: `key-features-docs/glossary/hudi.md`
- Create: `key-features-docs/glossary/async-materialized-view.md`
- Create: `key-features-docs/glossary/lz4-compression.md`

- [ ] **Step 1: BM25**

`key-features-docs/glossary/bm25.md`:

```markdown
---
slug: bm25
title: BM25
summary: Probabilistic ranking function for full-text relevance scoring.
tags: [search, indexing, algorithm]
---

# BM25

<TagChips />

BM25 (Best Match 25) is a ranking function used by search engines to estimate the relevance of a document to a given query. It builds on TF-IDF but addresses two of its shortcomings: term frequency saturation (a term mentioned 100 times shouldn't be 100× more relevant than mentioned once) and document length normalization (longer documents shouldn't dominate just because they contain more words).

## Formula

For a query `Q` containing terms `q_1, ..., q_n`, the BM25 score of a document `D` is:

`score(D, Q) = Σ IDF(q_i) · (f(q_i, D) · (k1 + 1)) / (f(q_i, D) + k1 · (1 - b + b · |D|/avgdl))`

Where `f(q_i, D)` is term frequency in `D`, `|D|` is document length, `avgdl` is average document length across the corpus, and `k1` and `b` are tuning parameters (typically `k1=1.2`, `b=0.75`).

## In Doris

BM25 is the default scoring function for inverted-index columns when running full-text matching queries. It can be combined with vector similarity scores in hybrid search via expression-level re-ranking.

<RelatedConcepts ids={['inverted-index']} />
```

- [ ] **Step 2: Inverted Index**

`key-features-docs/glossary/inverted-index.md`:

```markdown
---
slug: inverted-index
title: Inverted Index
summary: Maps terms to the set of documents containing them; the foundation of full-text search.
tags: [indexing, search, data-structure]
---

# Inverted Index

<TagChips />

An inverted index is a data structure that maps each unique term in a corpus to the list of document IDs (and often positions within documents) where that term appears. The "inversion" is relative to a forward index, which would map document IDs to their term contents.

## Why it matters

Full-text search at scale only works because of inverted indexes. To answer "which documents contain the word `apache`?" you don't scan every document — you look up `apache` in the index and read its posting list directly.

## In Doris

Inverted indexes in Doris support exact match, phrase match, and prefix match queries. They feed BM25 scoring for ranked retrieval and can be combined with bitmap operations for boolean queries (AND/OR/NOT across multiple terms).

<RelatedConcepts ids={['bm25']} />
```

- [ ] **Step 3: ANN Search**

`key-features-docs/glossary/ann-search.md`:

```markdown
---
slug: ann-search
title: ANN Search
summary: Approximate nearest neighbor search — the practical algorithm class for vector retrieval at scale.
tags: [search, ai, algorithm]
---

# ANN Search

<TagChips />

Approximate nearest neighbor (ANN) search is the practical alternative to exact k-NN when corpora exceed a few thousand vectors. Exact k-NN requires comparing the query vector against every candidate (O(n) per query); ANN trades a small amount of recall for orders-of-magnitude faster query time.

## Common algorithms

- **HNSW** (Hierarchical Navigable Small World): graph-based, excellent recall/latency tradeoff at the cost of memory.
- **IVF** (Inverted File): partitions the vector space into Voronoi cells; queries probe a small number of cells.
- **PQ** (Product Quantization): compresses vectors into compact codes, enabling in-memory storage of very large corpora.

## In Doris

Doris uses HNSW as the primary index for vector columns, with tunable `ef_construction` and `M` parameters per index. Vector search integrates with SQL: filters, joins, and aggregations apply to the same query that performs ANN retrieval.

<RelatedConcepts ids={['bm25']} />
```

- [ ] **Step 4: Iceberg**

`key-features-docs/glossary/iceberg.md`:

```markdown
---
slug: iceberg
title: Apache Iceberg
summary: Open table format for huge analytic datasets, with hidden partitioning and full schema evolution.
tags: [lakehouse, file-format]
---

# Apache Iceberg

<TagChips />

Apache Iceberg is an open table format designed for petabyte-scale analytics. It separates the *table* concept (a stable name with schema and metadata) from the *file layout* (Parquet/ORC files in object storage), allowing safe schema and partition evolution without rewriting data.

## What makes it different

- **Hidden partitioning**: queries don't need to specify partition predicates; Iceberg derives them from filter columns.
- **Snapshot isolation**: every write produces a new immutable snapshot, enabling time-travel queries and atomic rollbacks.
- **Full schema evolution**: add, drop, rename, or reorder columns without rewriting files.

## In Doris

Doris reads Iceberg tables directly via the multi-catalog interface. Predicate pushdown extends down to Iceberg's metadata layer, so partition pruning and file skipping happen before any data is read.

<RelatedConcepts ids={['hudi']} />
```

- [ ] **Step 5: Hudi**

`key-features-docs/glossary/hudi.md`:

```markdown
---
slug: hudi
title: Apache Hudi
summary: Lakehouse table format optimized for streaming ingest and incremental processing.
tags: [lakehouse, ingestion, file-format]
---

# Apache Hudi

<TagChips />

Apache Hudi is an open table format that brings transactional semantics — upserts, deletes, and incremental queries — to data lake storage. Where Iceberg emphasizes analytical correctness and schema evolution, Hudi emphasizes streaming write patterns and near-real-time freshness.

## Two table types

- **Copy-on-Write (CoW)**: rewrites entire files on update; reads are pure Parquet (fast, no merge cost).
- **Merge-on-Read (MoR)**: writes deltas to log files, merged at query time (faster ingest, slower scan).

## In Doris

Doris supports both CoW and MoR Hudi tables via the multi-catalog interface. For MoR tables, the merge happens transparently during scan.

<RelatedConcepts ids={['iceberg']} />
```

- [ ] **Step 6: Async Materialized View**

`key-features-docs/glossary/async-materialized-view.md`:

```markdown
---
slug: async-materialized-view
title: Async Materialized View
summary: Precomputed query result that is refreshed asynchronously and used to transparently accelerate matching queries.
tags: [query-engine, mechanism]
---

# Async Materialized View

<TagChips />

An async materialized view (AMV) is a database object that stores the result of a SQL query and refreshes it asynchronously, decoupled from base-table writes. At query time, the optimizer can detect that a user query is structurally subsumed by an AMV's definition and rewrite the plan to read from the AMV instead — without the application changing its SQL.

## Refresh strategies

- **Full refresh**: re-runs the entire definition.
- **Incremental refresh**: only recomputes the changed partitions/rows on the base tables.
- **Triggered refresh**: refresh fires when a freshness threshold is breached.

## Why "async"

Synchronous materialized views (rewriting on every base-table commit) impose latency on writes. Async refresh keeps writes fast, at the cost of bounded staleness.

<RelatedConcepts />
```

- [ ] **Step 7: LZ4 Compression**

`key-features-docs/glossary/lz4-compression.md`:

```markdown
---
slug: lz4-compression
title: LZ4 Compression
summary: Fast lossless compression algorithm used in Doris storage and shuffle paths.
tags: [storage, algorithm]
---

# LZ4 Compression

<TagChips />

LZ4 is a lossless byte-level compression algorithm prioritized for speed over compression ratio. It is widely used in systems where compression must not become a CPU bottleneck — including Apache Doris's storage format and inter-node shuffle.

## Tradeoff

LZ4 compresses at ~500 MB/s and decompresses at ~2 GB/s on commodity hardware. Compression ratio is typically 1.5–3× — worse than zstd or gzip, but the raw throughput makes it the right choice for hot paths where the alternative is no compression at all.

## In Doris

Doris uses LZ4 as a default codec for column data and shuffle. For cold/archival data, zstd (higher ratio, slower) is selectable per column or per partition.

<RelatedConcepts />
```

- [ ] **Step 8: Visual verify**

`yarn start`. Navigate to `/why-doris/key-features/glossary`. Confirm:

- Counter shows "7 entries"
- All 7 entries listed alphabetically: ANN Search, Apache Hudi, Apache Iceberg, Async Materialized View, BM25, Inverted Index, LZ4 Compression
- Sticky letter headers: A, B, I, L
- Filter chips work: clicking `[Search]` shows ANN Search, BM25, Inverted Index
- Adding `[Algorithm]` (different group, AND) narrows to ANN Search, BM25
- URL updates to `?tag=search,algorithm`
- Clear button resets

Navigate to a specific entry: `/why-doris/key-features/glossary/bm25`. Confirm:

- Tag chips render under H1
- Body content renders
- "Related concepts" section at the bottom links to Inverted Index
- Click "Inverted Index" → navigates correctly

Resize to mobile (<640px). Confirm:

- Filter bar disappears
- Sheet trigger appears
- Tap opens bottom sheet, scroll locked
- Apply button shows live count
- Closing sheet preserves selection

- [ ] **Step 9: Commit**

```bash
git add key-features-docs/glossary/
git commit -m "feat(key-features): seed 7 glossary entries"
```

---

## Phase 6: Polish & Final Verification

### Task 6.1: Test all three breakpoints

**Files:** (none modified — verification only)

- [ ] **Step 1: Desktop (≥ 996px)**

Open `/why-doris/key-features` at 1280×800. Verify:
- Hero is full-bleed
- Card grid: featured cards span 8 cols (one row of 1 featured + 1 regular, or 2 featureds), regular cards span 4 cols (3 per row)
- Glossary CTA banner: counter visible

Open `/why-doris/key-features/glossary` at 1280×800. Verify:
- Filter bar fully visible, sticky on scroll
- Active filter shows in summary line

- [ ] **Step 2: Tablet (640–996px)**

Resize to 800×1024. Verify:
- Card grid: 6-col grid with each card spanning 6 (one card per row)
- Filter bar wraps but still visible

- [ ] **Step 3: Mobile (< 640px)**

Resize to 375×667. Verify:
- Card grid: single column, all cards same width
- Hero pillar tags stack vertically
- CTAs stack vertically
- Filter bar hidden, sheet trigger visible
- Sheet opens to ~80vh, scrolls internally
- Letter headers stay sticky inside the list

If any breakpoint regresses, fix in the relevant component's `.module.scss` and re-verify.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(key-features): responsive polish across three breakpoints"
```

(Skip this step if no fixes needed.)

---

### Task 6.2: Build & serve final verification

**Files:** (none modified — verification only)

- [ ] **Step 1: Production build**

```bash
yarn build 2>&1 | tee /tmp/key-features-final-build.log
```

Expected: build completes without errors. Search the log for warnings related to key-features:

```bash
grep -iE "key.features|why.doris" /tmp/key-features-final-build.log | grep -iE "warn|error" | head -20
```

Investigate any warnings. Broken-link warnings are common and indicate cross-reference errors that need fixing.

- [ ] **Step 2: Serve and click through**

```bash
yarn serve --port 3030
```

Manually click through:

1. Home → Why Doris → Key Features → land on `/why-doris/key-features`
2. Click each of the 3 cards → confirm article renders
3. From any feature article, click a "Related concepts" card → confirm glossary entry renders
4. Bottom CTA → Glossary index
5. Type in search box → list filters by title
6. Click multiple chips → filter logic works (OR within group, AND across groups)
7. URL updates with `?tag=...`; refresh page → state persists; click Back → returns to previous filter state
8. Click "Clear all" → all chips deselect, URL drops `tag` param
9. Click any glossary entry → article renders with chips, "Related concepts" at bottom

- [ ] **Step 3: Commit**

No code changes expected. If anything was fixed in this phase, commit:

```bash
git add -A
git commit -m "fix(key-features): final verification fixes"
```

(Skip if clean.)

---

### Task 6.3: Final summary commit

- [ ] **Step 1: Confirm clean working tree and verify branch state**

```bash
git status
git log --oneline | head -25
```

Expected: clean tree. The log should show ~20 commits since starting Phase 0, each focused on one task.

- [ ] **Step 2: Optional — squash for PR**

If the project's PR workflow expects a single commit, squash with `git rebase -i HEAD~N`. Otherwise leave the granular history (recommended — easier to review and bisect).

---

## Out of Scope (Confirmed Deferred)

These are deliberately not implemented in this plan, per spec §6.4:

- Lint / validation tooling for `_tags.yml` or frontmatter.
- Auto-injection of `<TagChips />` via docs theme swizzle (authors manually add a single line).
- Fuzzy search / typeahead (current: `startsWith`).
- Hero ornamental polish (animated grids, counter increment animation).
- Tag color tokens promoted into a shared design system.
- i18n.
- Dev-mode warning for card slug ↔ feature article mismatch (spec §7.3).

---

## Risks Tracked During Implementation

- **Phase 0 routing collision**: blocks all subsequent work if Step 6 fails. Fallback documented in spec §7.1.
- **YAML loader friction (Task 1.1 Step 4)**: if `js-yaml-loader` doesn't integrate cleanly, fall back to a `.ts` data file mirroring the YAML. Both are acceptable per spec §3.3.
- **`useDoc()` hook context**: `TagChips` and `RelatedConcepts` always call `useDoc()` at the top of render. Any non-MDX usage will throw. The plan only uses these inside MDX, so this is fine — but if a future caller wants to use them outside MDX, they will need a different component or a context-detecting wrapper.
