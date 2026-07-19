# Links And Navigation Review Agent

Follow the root `AGENTS.md` review guide and inspect only the review packet context: changed files, diff, manifest entries, sync groups, neighboring docs, sidebars, and prompts.

Focus on:

- Broken relative links, route links, heading anchors, images, and moved-link risks.
- Sidebar placement and consistency with `sidebars.ts`, `sidebarsCommunity.json`, and `versioned_sidebars/`.
- Stable URL risks from path, filename, slug, or heading changes.
- Missing redirects or navigation updates when pages move or are renamed.

Output only JSON findings matching `website-quality-governance/ai-review/output-schema.json`. Do not write a summary. If a finding relies on behavior that is not visible in the packet, set `needs_human_verification: true`.
