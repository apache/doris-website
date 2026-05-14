---
name: doris-doc-optimize
description: Restructure and SEO/GEO-optimize an existing Apache Doris user documentation file (`.md` / `.mdx`), primarily under `i18n/zh-CN/docusaurus-plugin-content-docs-next/current/` or `docs-next/`. The skill reorganizes the doc from a user-scenario perspective, applies tables and lists for parameters / scenarios / FAQs, fixes formatting (4-space indent, code-block language tags, blank lines, Chinese/English spacing, command-concatenation bugs), validates every external link with `curl` and every `/images/...` reference against `static/`, and updates the frontmatter `description` + `keywords` per the bundled `./references/seo-geo.md` guide — all without changing the original meaning or dropping any technical content (commands, parameters, YAML, sample outputs, images are preserved verbatim). Use this skill whenever the user points at a single Doris doc file and asks to "优化这篇文档", "重新组织这篇文档", "帮我优化文档结构", "对这篇文章进行 SEO 优化", "按 SEO/GEO 优化这篇文档", "调整一下这篇文档的结构", "把这篇文档润色一下", "optimize this doc", "restructure this doc", "polish this doc", or anything similar — even if the user only says "make this doc better" or "这篇文档读起来不顺" while pointing at a Doris doc path. Do NOT use this skill for translating between languages (use `doris-translate-zh-to-en` instead), writing a brand-new doc from scratch (use `doris-feature-card` or `doc-coauthoring`), or pure link-checking without restructure (use `check-md-links` instead).
---

# Doris Doc Optimize

Optimize an existing Apache Doris user-documentation file in place: restructure for clarity, apply SEO/GEO best practices, fix formatting, and verify links — all while preserving every piece of technical content from the original.

## Audience and intent

The user has a Doris doc that is technically correct but hard to scan, has weak SEO metadata, or has accumulated small format / grammar issues. They want the same content reorganized to be more useful for readers and search engines. They are **not** asking for new technical material, translation, or a from-scratch rewrite.

The most common files this skill operates on:
- `i18n/zh-CN/docusaurus-plugin-content-docs-next/current/**/*.md` (Chinese docs, JSON-style frontmatter inside `---` fences)
- `docs-next/**/*.md` or `docs-next/**/*.mdx` (English docs, YAML frontmatter)

## Inputs

- **Required**: a path to one `.md` or `.mdx` file (typically the user `@`-references it or pastes the path). If the user gives multiple files or a directory, stop and ask which single file to optimize — this skill operates on one file at a time.
- **Optional**: extra instructions the user adds (e.g. "保留所有截图", "再加一节 troubleshooting"). Treat these as constraints layered on top of the default workflow.

If no file path is provided, ask for one before doing anything else. Do not guess.

## Paths used by this skill

At runtime the working directory is the `doris-website` repo root. The paths below mix two conventions — pay attention to which is which:

- **SEO/GEO guide (must read at runtime)**: `./references/seo-geo.md` **relative to this skill's directory** — i.e. resolve it as `doc-tools/skills/doris-doc-optimize/references/seo-geo.md` from the repo root. This is the source of truth for description length, keyword strategy, knowledge-type meta comments, and structural patterns. Read it on every run; it can evolve.
- **Static image assets** (repo-relative): `./static/` — internal references like `/images/next/install/foo.png` must resolve to `./static/images/next/install/foo.png`.
- **Internal doc cross-references**: never include `.md` / `.mdx` extensions (project convention).

## Workflow

Run the steps in order. Step 1 (read the file) and step 2 (read the SEO/GEO guide) can run in parallel.

### Step 1 — Read the target file

Read the entire file. Note:
- Frontmatter style (JSON-inside-`---` for zh-CN Doris docs, YAML elsewhere) — preserve it exactly.
- All code blocks, YAML samples, image references, and example outputs — these are immutable content; you may regroup them but never delete or rewrite their substance.
- The language (zh-CN vs en) — this affects keyword strategy and section names.

### Step 2 — Read `./references/seo-geo.md`

Always read the bundled SEO/GEO guide at runtime so the latest conventions apply. The path is relative to this skill's directory — resolve it to `doc-tools/skills/doris-doc-optimize/references/seo-geo.md` from the repo root. Pull from it:
- The frontmatter checklist (title / description / keywords).
- The GEO knowledge-type and 适用场景 meta-comment patterns.
- The structural recommendations per doc type (Guide / Reference / Feature / Tutorial / FAQ / Mixed).

### Step 3 — Plan the new structure

Before writing, sketch the target outline. The goal is **scenario-driven** organization — the reader should be able to answer "is this doc for me?" within the first screen, then follow a clear path to action.

A typical reshape adds these sections near the top (use only the ones that apply — don't pad):

1. **Opening paragraph** — one short paragraph framing who the doc is for and what they will achieve.
2. **适用场景 / Use cases** — a table when there are multiple scenarios; omit if the doc has a single obvious use case.
3. **前置条件 / Prerequisites** — a bulleted list of environment / version / permission requirements; omit if there are none.
4. **流程总览 / Overview** — a numbered list of the high-level steps; only when the doc has a multi-step procedure (≥3 steps).

For the body:
- Group related content into clear H2 sections, with H3 sub-steps.
- Each procedural block follows **目的 → 命令 → 说明** (intent → command → explanation), so a reader copying commands always knows why.
- Move parameter explanations into tables (one row per field).
- End with a **常见问题 / Troubleshooting** table when the doc has clear failure modes (the original had warnings, "if X then Y" prose, or known pitfalls). If the original has none, do not invent failure modes.

**Important**: every heading from the original must have its content reachable in the new version. You may rename, regroup, or split sections — but if any original H2/H3 carried content, that content must land somewhere in the output.

### Step 4 — Rewrite the file

Apply the plan. While rewriting, enforce:

**Content preservation**
- All commands, YAML, JSON, sample outputs, and image references are kept verbatim. You may move them, but not edit them — except to fix obvious typos in the prose around them, or to fix code-block-internal bugs that are clearly wrong (e.g. two shell commands concatenated with no newline; missing closing brace in a non-functional snippet). When in doubt, leave it as-is and note it in the summary.
- Never invent new commands, parameters, version numbers, or facts. If the original is ambiguous, preserve the ambiguity.

**Writing**
- Tighten paragraphs to ≤3 sentences each.
- Unify terminology — `Kubernetes` (not `kubernetes` or `K8s` mid-sentence), `Prometheus`, `Grafana`, `Helm`, `Doris`, etc. Match the canonical casing of each product name.
- Insert a space between Chinese characters and adjacent ASCII letters / digits (e.g. `部署 Prometheus`, not `部署Prometheus`).
- Fix obvious grammar, punctuation, and typos in the prose.

**Structure**
- Tables for: parameter explanations, scenario matrices, troubleshooting, comparison.
- Ordered lists for: sequential steps.
- Unordered lists for: prerequisites, non-sequential items, bullet-point summaries.

**Format hygiene**
- Indentation: 4 spaces (Markdown nested lists and YAML inside fenced blocks).
- Code-block language tags: `shell` / `bash` for commands, `yaml` for YAML, `json` for JSON, `sql` for SQL, `text` for plain output (Pod listings, log lines, expected stdout). Do not use `shell` for non-shell output.
- One blank line between blocks; no trailing blank lines at end of file.
- Spaces around inline code: `` 访问 `http://...` `` style.

**SEO / GEO**
- Update frontmatter `description` to be problem-oriented and ≤120 chars. Preserve the existing frontmatter shape (JSON-style for zh-CN Doris docs, YAML elsewhere).
- Expand `keywords` to cover synonyms, error/scenario keywords, and (for zh-CN) Chinese long-tail variants. Keep the original keywords; only add.
- Insert `<!-- 知识类型: ... -->` and `<!-- 适用场景: ... -->` HTML comments at the top of major sections per `./references/seo-geo.md`. Place them above the H2/H3 they describe, not inline.

**Internal links**
- Doc cross-references must NOT include `.md` / `.mdx` extensions (project convention). If the original violates this, fix it.

### Step 5 — Validate links

Run validation in parallel; fast and worth the time.

**External `http(s)` links** — for each unique URL:
```shell
curl -sI -o /dev/null -w "%{http_code}\n" <url>
```
If HEAD returns 4xx (especially 403/405), retry with `curl -sIL` (follow redirects) and then `curl -sL -o /dev/null -w "%{http_code}\n" <url>` (GET). Accept 2xx and 3xx as alive. Anything else, flag in the summary; do not silently remove the link.

**Image references** — for each `/images/...` path, check that `./static/images/...` exists:
```shell
test -f ./static/images/next/install/foo.png && echo OK || echo MISSING
```

**Internal doc links** — verify the target file exists (with `.md` / `.mdx` / `index.md` fallback, since the project strips extensions). If a link points to a non-existent doc, flag it; do not delete.

### Step 6 — Write the file

Overwrite the target file in place using the `Write` tool. Read first if you haven't yet in this turn (you usually will have, in Step 1).

### Step 7 — Report

Print a short summary listing:

1. **Structural changes** — sections added (适用场景, 前置条件, 流程总览, 常见问题, etc.), sections merged, parameter table extracted from prose.
2. **SEO/GEO additions** — new `description` (quote it), `keywords` added, knowledge-type meta comments inserted, FAQ table added.
3. **Bug fixes** — typos / grammar / command-concatenation fixes / wrong code-block language tags / `.md` extensions stripped from internal links. List concretely so the user can spot-check.
4. **Link-check results** — count of external links checked (all green / N flagged), images verified (all present / N missing). For any flag, name the URL or path.

Keep the summary under ~15 lines. The user can read the diff; the summary's job is to highlight non-obvious changes and any flags that need their attention.

## Constraints and guardrails

These exist because the failure mode for this skill is silent content loss or hallucinated facts — both worse than leaving the doc unchanged.

- **Never invent**: no new commands, parameters, version numbers, error messages, or troubleshooting steps that weren't in the original (or obviously implied by it).
- **Never delete**: code blocks, image references, example outputs, and admonitions stay. If a section feels redundant, merge it; don't drop it.
- **Preserve frontmatter shape**: zh-CN Doris docs use a JSON object inside `---` fences — keep that exact form. English docs use standard YAML — keep that.
- **No `.md` / `.mdx` extensions in internal doc cross-references** — project convention.
- **Don't translate**: if the user wants Chinese ↔ English, that is `doris-translate-zh-to-en`, not this skill.
- **One file per invocation**: if asked to optimize a folder, ask which single file to start with.

## Reference example

The canonical example is the install-prometheus-and-grafana doc under `i18n/zh-CN/docusaurus-plugin-content-docs-next/current/install/deploy-on-kubernetes/separating-storage-compute/`. The optimization:

- Added `适用场景` (table), `前置条件` (bullet list), `部署流程总览` (numbered list) at the top.
- Split each `Step N` into `N.1 / N.2 / N.3` sub-steps, each with intent → command → explanation.
- Extracted ServiceMonitor YAML field meanings into a parameter table.
- Added a `常见问题` table at the end covering the four most common failure modes implied by the original prose (Targets not visible, Targets DOWN, Grafana empty, port unreachable).
- Updated `description` to a 50-char problem-oriented summary; expanded `keywords` with Chinese long-tail terms (`存算分离`, `集群监控`, `指标采集`, `Dashboard`).
- Inserted `<!-- 知识类型 -->` and `<!-- 适用场景 -->` meta comments at the top of major sections.
- Fixed an upstream bug where `helm repo add ... helm-charts` and `helm repo update` had been concatenated into one line with no separator.
- Verified all three external links (`get-helm-3`, prometheus-community charts repo, dashboard JSON) returned 200, and confirmed all three image files existed under `static/images/next/install/`.

That run is a good shape to emulate, but adapt to the doc in front of you — don't force these exact sections onto a doc that doesn't need them.

## Self-check before reporting done

Before printing the summary:
- Diff the new file against the original mentally: is every code block, image, and YAML sample still present?
- Did you read `./references/seo-geo.md` this run? (Yes / re-read it.)
- Did you actually run `curl` on every external link, not just eyeball them?
- Is the frontmatter shape unchanged?
- Are there any internal doc cross-references with `.md` / `.mdx` still on them?

If any answer is wrong, fix before reporting.
