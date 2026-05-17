#!/usr/bin/env python3
"""
Generate config/redirects-4.x.json from the diff between old and new 4.x slugs.

Reads:
    scripts/migrate-4.x/old-slugs.txt
    scripts/migrate-4.x/new-slugs-en.txt
    scripts/migrate-4.x/new-slugs-zh.txt

Writes:
    config/redirects-4.x.json

Mapping rules, applied in order:
    1. Old slug already exists in the *target locale's* new tree → no redirect
       emitted for that locale (en and zh are checked independently because the
       Dev → 4.x snapshot inherited an en/zh content divergence).
    2. PREFIX_RENAMES: top-level dir rename (gettingStarted/ → getting-started/);
       the suffix is preserved and the result must exist in the new tree, else
       falls through to step 3.
    3. PREFIX_FALLBACKS: catch-all per top-level dir mapping the entire subtree
       to a single landing page (works for db-connect, benchmark, ecosystem,
       gettingStarted/alternatives, …).
    4. DEFAULT_FALLBACK: docs home.

Each rule emits the en (/docs/4.x/<slug>) and/or zh-CN (/zh-CN/docs/4.x/<slug>)
entry depending on whether that locale's new tree already serves the slug.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OLD = ROOT / "scripts/migrate-4.x/old-slugs.txt"
NEW_EN = ROOT / "scripts/migrate-4.x/new-slugs-en.txt"
NEW_ZH = ROOT / "scripts/migrate-4.x/new-slugs-zh.txt"
OUT = ROOT / "config/redirects-4.x.json"

DEFAULT_FALLBACK = "/docs/4.x/getting-started/what-is-apache-doris"

PREFIX_RENAMES = [
    ("gettingStarted/", "getting-started/"),
]

PREFIX_FALLBACKS = [
    ("gettingStarted/alternatives/", "/why-doris/compare"),
    ("db-connect/",                  "/docs/4.x/connection-integration/mysql-proto"),
    ("benchmark/",                   "/why-doris/benchmarks"),
    ("ecosystem/",                   "/ecosystem/cluster-management"),
]


def to_zh(target: str) -> str:
    if target.startswith("/docs/"):
        return target.replace("/docs/", "/zh-CN/docs/", 1)
    return "/zh-CN" + target


def resolve(slug: str, new_set: set[str]) -> str:
    for old_prefix, new_prefix in PREFIX_RENAMES:
        if slug.startswith(old_prefix):
            candidate = new_prefix + slug[len(old_prefix):]
            if candidate in new_set:
                return f"/docs/4.x/{candidate}"
    for prefix, target in PREFIX_FALLBACKS:
        if slug.startswith(prefix):
            return target
    return DEFAULT_FALLBACK


def load_slugs(path: Path) -> set[str]:
    return {ln.strip() for ln in path.read_text().splitlines() if ln.strip()}


def main() -> None:
    old = [ln.strip() for ln in OLD.read_text().splitlines() if ln.strip()]
    new_en = load_slugs(NEW_EN)
    new_zh = load_slugs(NEW_ZH)

    entries = []
    skipped_en = 0
    skipped_zh = 0
    for slug in old:
        target_en = resolve(slug, new_en)
        if slug in new_en:
            skipped_en += 1
        else:
            entries.append({"from": f"/docs/4.x/{slug}", "to": target_en})
        if slug in new_zh:
            skipped_zh += 1
        else:
            entries.append({"from": f"/zh-CN/docs/4.x/{slug}", "to": to_zh(target_en)})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n")
    print(
        f"Wrote {len(entries)} redirects to {OUT.relative_to(ROOT)} "
        f"(skipped {skipped_en} en + {skipped_zh} zh that already exist in new tree)"
    )


if __name__ == "__main__":
    main()
