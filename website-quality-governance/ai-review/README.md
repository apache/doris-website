# Docs AI Review MVP

This directory contains the Week 7 AI review assets for Apache Doris website PRs. The workflow prepares a bounded review packet for documentation-focused AI agents; it does not make deterministic CI decisions.

## Triggering

- Manual PR comment: `/review-docs`
- PR label: `ai-review-docs`
- Manual GitHub Actions dispatch: `docs-ai-review.yml`

The existing generic `/review` workflow remains separate in `.github/workflows/opencode-review.yml`.

## Local Commands

```bash
yarn docs:ai-review:prepare --files docs/gettingStarted/what-is-apache-doris.md --output website-quality-governance/generated/ai-review-packet.json
yarn docs:ai-review:validate --input website-quality-governance/generated/ai-review-findings.json
yarn docs:ai-review:dedupe --input website-quality-governance/generated/ai-review-findings.json --output website-quality-governance/generated/ai-review-findings-deduped.json
```

Use `--changed` to derive changed files from git, or `--base <ref>` to include a diff against a PR base.

## Review Contract

- Agents must follow the root `AGENTS.md` review guide.
- Agents must output only JSON findings that match `output-schema.json`.
- Agents must not include a broad summary in the findings output.
- If an issue depends on Apache Doris feature behavior and the packet does not contain evidence, agents must set `needs_human_verification: true`.
- `blocking_recommendation` is only an AI suggestion. Deterministic governance checks decide whether CI blocks a PR.
