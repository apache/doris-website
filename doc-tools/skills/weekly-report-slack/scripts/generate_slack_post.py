#!/usr/bin/env python3
"""Generate an Apache Doris weekly report Slack post from structured MDX."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


DEFAULT_SITE_URL = "https://doris.apache.org"


class ReportError(RuntimeError):
    pass


def load_json_export(source: str, export_name: str) -> Any:
    pattern = re.compile(rf"export\s+const\s+{re.escape(export_name)}\s*=")
    match = pattern.search(source)
    if not match:
        raise ReportError(f"Missing export const {export_name}")

    value_source = source[match.end() :].lstrip()
    decoder = json.JSONDecoder()
    try:
        value, _ = decoder.raw_decode(value_source)
    except json.JSONDecodeError as exc:
        raise ReportError(f"Could not parse export const {export_name}: {exc}") from exc
    return value


def highlight_title(highlight: Any) -> str:
    if isinstance(highlight, str):
        return highlight.strip()
    if isinstance(highlight, dict):
        title = str(highlight.get("title", "")).strip()
        if title:
            return title
        narrative = str(highlight.get("narrative", "")).strip()
        if narrative:
            return narrative
    return ""


def build_report_link(report_path: Path, report_link: str | None, site_url: str) -> str:
    if report_link:
        return report_link
    report_id = report_path.stem
    return f"{site_url.rstrip('/')}/community-report#{report_id}"


def generate_post(report_path: Path, report_link: str | None, site_url: str) -> str:
    source = report_path.read_text(encoding="utf-8")

    label = load_json_export(source, "label")
    report = load_json_export(source, "report")

    summary = report.get("summary")
    if not isinstance(summary, dict):
        raise ReportError("Missing report.summary")

    highlights_value = summary.get("highlights")
    if not isinstance(highlights_value, list) or not highlights_value:
        raise ReportError("Missing report.summary.highlights")

    highlights = [title for title in (highlight_title(item) for item in highlights_value) if title]
    if not highlights:
        raise ReportError("No usable highlight titles found in report.summary.highlights")

    lead = str(summary.get("lead", "")).strip()
    if not lead:
        raise ReportError("Missing report.summary.lead")

    link = build_report_link(report_path, report_link, site_url)
    bullets = "\n".join(f"• {title}" for title in highlights[:3])

    return "\n".join(
        [
            f"📊 *Apache Doris Weekly Report — {label}*",
            "",
            lead,
            "",
            "✨ *Highlights*",
            bullets,
            "",
            "👉 Read the full weekly report:",
            link,
            "",
            "Big thanks to everyone who contributed, reviewed, tested, reported issues, and shared feedback this week! 🙌",
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report_path", type=Path, help="Path to the weekly report .md or .mdx file")
    parser.add_argument("--report-link", help="Override the generated public report link")
    parser.add_argument("--site-url", default=DEFAULT_SITE_URL, help=f"Site URL used for default links ({DEFAULT_SITE_URL})")
    args = parser.parse_args()

    if not args.report_path.is_file():
        print(f"error: report file not found: {args.report_path}", file=sys.stderr)
        return 2

    try:
        print(generate_post(args.report_path, args.report_link, args.site_url))
    except ReportError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
