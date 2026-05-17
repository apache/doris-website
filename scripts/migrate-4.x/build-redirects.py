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
       Dev → 4.x snapshot inherited an en/zh content divergence). "Existence"
       includes Docusaurus' category-as-doc rewrites: a sidebar category whose
       `link` is `{type: "doc", id: "parent/leaf"}` pulls that doc up to the
       category URL `/parent/`, so old slug `parent` is treated as live.
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
SIDEBAR_4X = ROOT / "versioned_sidebars/version-4.x-sidebars.json"
OUT = ROOT / "config/redirects-4.x.json"

DEFAULT_FALLBACK = "/docs/4.x/getting-started/what-is-apache-doris"

PREFIX_RENAMES = [
    ("gettingStarted/", "getting-started/"),
]

# Per-slug overrides applied before the prefix-rename / fallback pass.
# Each entry maps an *old* slug to a specific *new* slug (resolved against
# the en tree; the zh side reuses the same path via to_zh()). Use this when
# a slug moved to a non-obvious new location that the prefix heuristics
# can't infer — e.g. /ecosystem/* docs that were reorganized into
# /connection-integration/data-integration/ or /install/deploy-on-kubernetes/.
EXPLICIT_SLUG_MAP = {
    # /ecosystem/* → /connection-integration/data-integration/*
    "ecosystem/automq-load":                                "connection-integration/data-integration/automq",
    "ecosystem/bi/apache-superset":                         "connection-integration/data-integration/superset",
    "ecosystem/bi/clouddm":                                 "connection-integration/data-integration/clouddm",
    "ecosystem/bi/datagrip":                                "connection-integration/data-integration/datagrip",
    "ecosystem/bi/dbeaver":                                 "connection-integration/data-integration/dbeaver",
    "ecosystem/bi/finebi":                                  "connection-integration/data-integration/finebi",
    "ecosystem/bi/metabase":                                "connection-integration/data-integration/metabase",
    "ecosystem/bi/powerbi":                                 "connection-integration/data-integration/powerbi",
    "ecosystem/bi/quickbi":                                 "connection-integration/data-integration/quickbi",
    "ecosystem/bi/quicksight":                              "connection-integration/data-integration/quicksight",
    "ecosystem/bi/smartbi":                                 "connection-integration/data-integration/smartbi",
    "ecosystem/bi/tableau":                                 "connection-integration/data-integration/tableau",
    "ecosystem/cloudcanal":                                 "connection-integration/data-integration/cloudcanal",
    "ecosystem/datax":                                      "connection-integration/data-integration/datax",
    "ecosystem/dbt-doris-adapter":                          "connection-integration/data-integration/dbt-doris-adapter",
    "ecosystem/doris-kafka-connector/doris-kafka-connector": "connection-integration/data-integration/doris-kafka-connector",
    "ecosystem/doris-kafka-connector/release-notes":        "connection-integration/data-integration/doris-kafka-connector",
    "ecosystem/doris-streamloader":                         "connection-integration/data-integration/doris-streamloader",
    "ecosystem/flink-doris-connector/flink-doris-connector": "connection-integration/data-integration/flink-doris-connector",
    "ecosystem/flink-doris-connector/release-notes":        "connection-integration/data-integration/flink-doris-connector",
    "ecosystem/hive-bitmap-udf":                            "connection-integration/data-integration/hive-udf",
    "ecosystem/hive-hll-udf":                               "connection-integration/data-integration/hive-udf",
    "ecosystem/kettle":                                     "connection-integration/data-integration/kettle",
    "ecosystem/kyuubi":                                     "connection-integration/data-integration/kyuubi",
    "ecosystem/observability/beats":                        "connection-integration/data-integration/beats",
    "ecosystem/observability/fluentbit":                    "connection-integration/data-integration/fluentbit",
    "ecosystem/observability/langfuse":                     "connection-integration/data-integration/langfuse",
    "ecosystem/observability/logstash":                     "connection-integration/data-integration/logstash",
    "ecosystem/observability/loongcollector":               "connection-integration/data-integration/loongcollector",
    "ecosystem/observability/opentelemetry":                "connection-integration/data-integration/opentelemetry",
    "ecosystem/observability/vector":                       "connection-integration/data-integration/vector",
    "ecosystem/seatunnel":                                  "connection-integration/data-integration/seatunnel",
    "ecosystem/spark-doris-connector/release-notes":        "connection-integration/data-integration/spark-doris-connector",
    "ecosystem/spark-doris-connector/spark-doris-connector": "connection-integration/data-integration/spark-doris-connector",
    # /ecosystem/doris-operator/* → /install/deploy-on-kubernetes/doris-operator/*
    "ecosystem/doris-operator/doris-operator-overview":     "install/deploy-on-kubernetes/doris-operator/doris-operator-overview",
    "ecosystem/doris-operator/on-alibaba":                  "install/deploy-on-kubernetes/doris-operator/on-alibaba",
    "ecosystem/doris-operator/on-aws":                      "install/deploy-on-kubernetes/doris-operator/on-aws",
    # ecosystem/spark-load has no direct new home; falls through to DEFAULT_FALLBACK.
}

PREFIX_FALLBACKS = [
    ("gettingStarted/alternatives/", "/why-doris/compare"),
    ("db-connect/",                  "/docs/4.x/connection-integration/mysql-proto"),
    ("benchmark/",                   "/why-doris/benchmarks"),
    # /ecosystem/* has been pulled apart by EXPLICIT_SLUG_MAP above; any
    # leftover ecosystem/* slug not covered there falls through to
    # DEFAULT_FALLBACK (docs home).
]


def to_zh(target: str) -> str:
    if target.startswith("/docs/"):
        return target.replace("/docs/", "/zh-CN/docs/", 1)
    return "/zh-CN" + target


def resolve(slug: str, new_set: set[str]) -> str:
    # 1. Explicit per-slug overrides take precedence.
    if slug in EXPLICIT_SLUG_MAP:
        target = EXPLICIT_SLUG_MAP[slug]
        if target in new_set:
            return f"/docs/4.x/{target}"
    # 2. Prefix renames (gettingStarted/ → getting-started/).
    for old_prefix, new_prefix in PREFIX_RENAMES:
        if slug.startswith(old_prefix):
            candidate = new_prefix + slug[len(old_prefix):]
            if candidate in new_set:
                return f"/docs/4.x/{candidate}"
    # 3. Whole-subtree fallbacks.
    for prefix, target in PREFIX_FALLBACKS:
        if slug.startswith(prefix):
            return target
    return DEFAULT_FALLBACK


def load_slugs(path: Path) -> set[str]:
    return {ln.strip() for ln in path.read_text().splitlines() if ln.strip()}


def category_landing_aliases(sidebar_path: Path) -> set[str]:
    """Walk a Docusaurus sidebar JSON and synthesize the slugs that
    category-as-doc rewrites turn into live URLs.

    A sidebar category with `link: {type: "doc", id: "X/leaf"}` makes
    Docusaurus serve doc `X/leaf` at URL `/X/` (the category path) instead
    of `/X/leaf/`. The category path `X` must be treated as an "existing
    slug" so we don't emit a redirect that would collide with it.
    """
    aliases: set[str] = set()
    data = json.loads(sidebar_path.read_text())

    def walk(node):
        if isinstance(node, dict):
            if node.get("type") == "category":
                link = node.get("link")
                if isinstance(link, dict) and link.get("type") == "doc":
                    docid = link.get("id", "")
                    parent, _, _ = docid.rpartition("/")
                    if parent:
                        aliases.add(parent)
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(data)
    return aliases


def main() -> None:
    old = [ln.strip() for ln in OLD.read_text().splitlines() if ln.strip()]
    new_en = load_slugs(NEW_EN)
    new_zh = load_slugs(NEW_ZH)

    # Sidebars are shared across locales, so category-as-doc aliases apply
    # to both new_en and new_zh equally.
    sidebar_aliases = category_landing_aliases(SIDEBAR_4X)
    new_en |= sidebar_aliases
    new_zh |= sidebar_aliases

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
