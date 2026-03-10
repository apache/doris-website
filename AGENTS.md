# AGENTS.md — Apache Doris Website

This is the codebase for the Apache Doris website and documentation site, built with Docusaurus. The current English docs live under `docs/`, active versioned docs live under `versioned_docs/`, Chinese localized docs live under `i18n/zh-CN/docusaurus-plugin-content-docs/`, community docs live under `community/`, Chinese localized community docs live under `i18n/zh-CN/docusaurus-plugin-content-docs-community/`, blog posts live under `blog/`, and the site UI/configuration lives under `src/`, `static/`, `config/`, `docusaurus.config.js`, `sidebars.ts`, `sidebarsCommunity.json`, `versioned_sidebars/`, and `versions.json`.

For review tasks, if the PR involves changes to the website's basic framework and display, you need to verify from the code level whether the changes are reasonable and comply with various front-end standards and best practices. If the PR is about submitting document content, you need to assess whether the content is reasonable and complete, ensuring it does not cause any confusion or ambiguity from the user's perspective. In summary, your principle is: first follow the standards mentioned in this document for the review, but the ultimate goal is to ensure a complete and seamless user experience with the documentation.

## Repository Conventions

- Follow the existing structure and writing style in the touched area. Keep terminology, heading hierarchy, front matter shape, and file placement consistent with neighboring files.
- Treat `sidebars.ts`, `sidebarsCommunity.json`, `versioned_sidebars/`, `versions.json`, and `docusaurus.config.js` as the authoritative sources for navigation, active versions, and routing. Do not rely on older README tree examples when they disagree with the current repository layout.
- Preserve stable URLs whenever possible. When moving, renaming, or deleting docs, review inbound links, sidebar references, redirects, and versioned or localized counterparts that may also need updates.
- The current active docs versions are defined in `versions.json`. In the current repository state they are `4.x`, `3.x`, `2.1`, and `current`, and many docs changes intentionally update the same topic across `docs/`, `versioned_docs/`, and the mirrored `i18n/zh-CN` trees together. Review missing mirror updates against the actual touched page set and nearby history, and treat them as issues when the repository context shows those mirrors are expected to stay aligned.
- Keep Docusaurus metadata correct. When editing docs or blog files, verify any relevant front matter fields such as `title`, `description`, `slug`, `keywords`, `sidebar_position`, and tags.
- Prefer targeted edits over broad rewrites. Avoid reformatting unrelated content, reordering large sections, or changing tone across a whole file unless the task explicitly requires it.
- When touching React, TypeScript, styling, or site configuration, preserve the existing visual language and implementation patterns already used in this repository.
- When touching community docs, remember that navigation is controlled separately by `sidebarsCommunity.json` and Chinese localized community content lives under `i18n/zh-CN/docusaurus-plugin-content-docs-community/`.

## Code Review

When conducting code review, including automated AI review and self-review, you must follow this file as the review guide. There is no separate review skill in this repository.

During review, you must individually provide conclusions for each applicable critical checkpoint below:

- What is the goal of the current change? Does the implementation actually satisfy that goal?
- Is the change as small, clear, and focused as possible?
- Does it preserve documentation information architecture correctly? Check affected current docs, active versioned docs, localized docs, blog/community pages, sidebars, and config references when applicable.
- If any page path, filename, heading anchor, slug, or sidebar item changed, are related links, redirects, and navigation references in `sidebars.ts`, `sidebarsCommunity.json`, `versioned_sidebars/`, `i18n/`, and config updated consistently?
- If the change touches Docusaurus config, React components, styling, or build scripts, does it match existing repository conventions and avoid breaking desktop or mobile behavior?
- What validation covers the change? State which checks are applicable and whether the change is sufficiently verified.
- Based on the code and content context, are there any other correctness, usability, accessibility, SEO, or maintainability issues?

Review emphasis by change type:

- **Documentation changes**: check factual consistency, active version/locale consistency, broken relative links, heading hierarchy, front matter, sidebar placement, and whether examples or commands still match surrounding docs. If only one version or locale is changed, determine from the surrounding files and recent history whether the asymmetry is intentional or incorrect.
- **Doc moves / renames / deletions**: check references from `docs/`, `versioned_docs/`, `i18n/`, `community/`, `sidebars.ts`, `sidebarsCommunity.json`, and `versioned_sidebars/`; verify redirect behavior and moved-link handling.
- **Frontend changes**: check responsive layout, hydration/build safety, accessibility basics, and visual consistency with the existing site.
- **Build or workflow changes**: check trigger conditions, required permissions, secret usage, checkout depth, and whether the workflow can operate on pull requests safely.

If you submit a review summary, keep it concrete and actionable. If no issue is found, explicitly say so.

## Documentation Standards

For documentation, you need to put yourself in the user's perspective, ensuring that after reading the documentation, you can fully understand the usage and meaning of the feature without any ambiguity or confusion. Any defects that hinder this goal are worth pointing out.

Ensure complete consistency in the Chinese and English expressions. If the same function differs in behavior due to redesign or bugfix in different versions, it must be clearly stated in the documentation. If no such statement is made, the expression of the same function must remain completely consistent across different versions. (This point is ignored for versions 2.1 and earlier.)

### SQL Function Documentation Standards

Every SQL function doc must contain the following sections in order: **Description**, **Syntax**, **Parameters**, **Return Value**, **Example**. Additional sections such as **Alias** or **Usage Notes** may follow Description when applicable.

- **Description**: one concise paragraph stating what the function does. State NULL-handling behavior here if it is a defining characteristic of the function.
- **Syntax**: a single fenced `sql` code block with the full formal syntax. Include all overloads and optional clauses. Use `<angle_bracket>` notation for placeholders.
- **Parameters**: a Markdown table with columns `Parameter` and `Description`. Mark optional parameters explicitly. State accepted types and constraints per parameter.
- **Return Value**: state the return type and describe what the value represents. Always document NULL return conditions.
- **Example**: provide a self-contained, runnable example. Cover: the normal/representative case, any significant optional parameter or overload, and the NULL-input behavior. Each query must be followed by its expected output in a fenced `text` block. Determine whether all possible typical and special inputs that may cause uncertainty among users are described with examples and coverage.

### Feature Documentation Standards

Feature docs (load methods, table types, catalog connectors, admin operations, etc.) are the primary reference for users performing a task. Each doc should cover:

- **Overview paragraph**: what the feature is and when to use it. State key constraints (size limits, protocol, atomicity guarantees) upfront.
- **Quick start / Basic usage**: a minimal end-to-end example a user can run immediately. Must include prerequisite setup (table DDL, permissions) before the main command.
- **Parameters / Options reference**: a table or structured list of all user-facing parameters. Include type, default value, whether required, and a concrete description of effect.
- **Examples**: cover the most common real-world scenarios, not just the simplest case. Each example must show the full command and its expected output or result. If a feature has multiple modes or formats (e.g., CSV vs JSON, with/without auth), show at least the representative variants.
- **Error handling and caveats**: note known failure modes, behavioral edge cases, and version-specific differences that a user is likely to hit.
- **Best practices**: How should the addition of this feature be weighed, and under what circumstances should it be used?

This content is not immutable. You should always aim to help users thoroughly and clearly understand the corresponding functions, allowing for flexible adjustments based on actual circumstances.
