#!/usr/bin/env python3
"""
Check whether all links (internal + external) in a single Markdown file are valid.

Usage:
    python3 scripts/check_md_links_single.py <markdown-file> [--no-external] [--timeout 10] [--workers 16]

Behavior:
- Parses [text](url) and ![alt](url) links.
- Skips links inside fenced code blocks (```...```) or inline code (`...`).
- Skips autolinks/anchor-only/empty/mailto/tel/javascript schemes (anchor-only is reported as info).
- Internal/relative links:
    * Resolves relative to the file's directory.
    * Maps versioned site routes such as `/docs/dev/...` to their source tree.
    * Follows explicit doc redirects only when their target source file exists.
    * If the path has no extension, tries the path itself, then `.md`, then `.mdx`,
      and also `<path>/index.md` / `<path>/index.mdx` (Docusaurus directory links).
- External links (http/https):
    * Sends a HEAD request first; falls back to GET on 405/403/non-2xx.
    * Considers 2xx and 3xx as valid.
- Anchor fragments (#section) on internal links are stripped before path resolution
  (matches the policy used by scripts/check_dead_links.py — anchors are not validated).

Exit code:
    0 if no broken links, 1 otherwise.
"""

import argparse
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache
from urllib.parse import urlparse, unquote

try:
    import urllib.request
    import urllib.error
except ImportError:
    print("urllib is required", file=sys.stderr)
    sys.exit(2)


LINK_RE = re.compile(r"!?\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+\"[^\"]*\")?\s*\)")
FENCED_RE = re.compile(r"```.*?```", re.DOTALL)
INLINE_CODE_RE = re.compile(r"`[^`\n]*`")

USER_AGENT = "Mozilla/5.0 (compatible; doris-link-checker/1.0)"


def find_masked_ranges(content: str):
    ranges = []
    for m in FENCED_RE.finditer(content):
        ranges.append((m.start(), m.end()))
    for m in INLINE_CODE_RE.finditer(content):
        ranges.append((m.start(), m.end()))
    return ranges


def in_ranges(pos: int, ranges) -> bool:
    for s, e in ranges:
        if s <= pos < e:
            return True
    return False


def line_of(content: str, pos: int) -> int:
    return content.count("\n", 0, pos) + 1


def extract_links(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    masked = find_masked_ranges(content)
    out = []
    for m in LINK_RE.finditer(content):
        if in_ranges(m.start(), masked):
            continue
        url = m.group(2).strip()
        out.append((line_of(content, m.start()), url))
    return out


@lru_cache(maxsize=None)
def _find_site_roots(start_dir: str):
    """Walk up from `start_dir` looking for a directory containing `static/`.

    Returns (site_root, static_root): the Docusaurus site root (parent of
    `static/`) and the `static/` directory itself. Both are None if not found.
    """
    current = os.path.abspath(start_dir)
    while True:
        candidate = os.path.join(current, "static")
        if os.path.isdir(candidate):
            return current, candidate
        parent = os.path.dirname(current)
        if parent == current:
            return None, None
        current = parent


# Docusaurus route-prefix → source-dir mapping for plugins whose route name
# differs from their on-disk directory. Same-name cases (community → community/,
# docs → docs/) are handled by the generic site-root fallback below.
ROUTE_PREFIX_REMAP = {
    "releases": "releasenotes",
}


def _candidates_for(full: str):
    return [full, full + ".md", full + ".mdx",
            os.path.join(full, "index.md"),
            os.path.join(full, "index.mdx")]


@lru_cache(maxsize=None)
def _doc_redirects(site_root: str):
    """Read the same explicit doc redirects as docusaurus.config.js."""
    redirects = {}
    for name in ("redirects-dev.json", "redirects-4.x.json"):
        config = os.path.join(site_root, "config", name)
        if os.path.isfile(config):
            with open(config, encoding="utf-8") as f:
                redirects.update((entry["from"].rstrip("/"), entry["to"])
                                 for entry in json.load(f))
    return redirects


def resolve_internal(base_dir: str, target: str):
    """Return the resolved file path if target exists, else None."""
    path_part = unquote(target.split("#", 1)[0].split("?", 1)[0])
    if path_part == "":
        return "anchor-only"

    if path_part.startswith("/"):
        # Resolve explicit redirects and version/locale routes before trying
        # static assets and paths relative to the site root.
        site_root, static_root = _find_site_roots(base_dir)
        if site_root is None:
            return None
        # createRedirects emits an alias only when its target is a real page;
        # another redirect alone is not sufficient.
        path_part = _doc_redirects(site_root).get(path_part.rstrip("/"), path_part)
        rel = path_part.lstrip("/")
        routed = re.match(r"(?:(ja|zh-CN)/)?(docs/(dev|[^/]+)|community|releases|course)/(.*)", rel)
        if routed:
            locale, route, version, rest = routed.groups()
            if route.startswith("docs/"):
                source = "docs" if version == "dev" else "versioned_docs/version-" + version
                plugin = "docusaurus-plugin-content-docs"
                content_version = "current" if version == "dev" else "version-" + version
            else:
                source = ROUTE_PREFIX_REMAP.get(route, route)
                plugin = "docusaurus-plugin-content-docs-" + route
                content_version = "current"
            roots = [source]
            if locale:
                roots.insert(0, f"i18n/{locale}/{plugin}/{content_version}")
            for root in roots:
                for candidate in _candidates_for(os.path.join(site_root, root, rest.rstrip("/"))):
                    if os.path.isfile(candidate):
                        return candidate
        head, _, rest = rel.partition("/")
        if head in ROUTE_PREFIX_REMAP and rest:
            remapped = os.path.normpath(
                os.path.join(site_root, ROUTE_PREFIX_REMAP[head], rest))
            for c in _candidates_for(remapped):
                if os.path.isfile(c):
                    return c
        for root in (static_root, site_root):
            full = os.path.normpath(os.path.join(root, rel))
            for c in _candidates_for(full):
                if os.path.isfile(c):
                    return c
        return None

    full = os.path.normpath(os.path.join(base_dir, path_part))
    for c in _candidates_for(full):
        if os.path.isfile(c):
            return c
    site_root, _ = _find_site_roots(base_dir)
    if site_root:
        relative = os.path.relpath(full, site_root).replace(os.sep, "/")
        localized = re.match(r"i18n/ja/docusaurus-plugin-content-docs(-[^/]+)?/(current|version-([^/]+))/(.*)", relative)
        if localized:
            suffix, _, version, rest = localized.groups()
            roots = {None: "docs", "-community": "community", "-releases": "releasenotes", "-course": "course"}
            source = "versioned_docs/version-" + version if version and suffix is None else roots.get(suffix) if not version else None
            if source:
                for candidate in _candidates_for(os.path.join(site_root, source, rest)):
                    if os.path.isfile(candidate):
                        return candidate
    return None


def check_external(url: str, timeout: float):
    """Return (ok, status_or_err)."""
    req_head = urllib.request.Request(url, method="HEAD",
                                      headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req_head, timeout=timeout) as resp:
            code = resp.getcode()
            if 200 <= code < 400:
                return True, code
    except urllib.error.HTTPError as e:
        if e.code in (403, 405, 501):
            pass
        elif 200 <= e.code < 400:
            return True, e.code
        else:
            return _try_get(url, timeout, fallback_status=e.code)
    except Exception as e:
        return _try_get(url, timeout, fallback_status=str(e))
    return _try_get(url, timeout)


def _try_get(url: str, timeout: float, fallback_status=None):
    req = urllib.request.Request(url, method="GET",
                                 headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            code = resp.getcode()
            if 200 <= code < 400:
                return True, code
            return False, code
    except urllib.error.HTTPError as e:
        return False, e.code
    except Exception as e:
        return False, fallback_status if fallback_status is not None else str(e)


def main():
    ap = argparse.ArgumentParser(description="Check Markdown links in a single file.")
    ap.add_argument("file", help="Path to the Markdown file to check")
    ap.add_argument("--no-external", action="store_true",
                    help="Skip checking http(s) external links")
    ap.add_argument("--timeout", type=float, default=10.0,
                    help="Timeout for external requests in seconds (default: 10)")
    ap.add_argument("--workers", type=int, default=16,
                    help="Concurrent workers for external checks (default: 16)")
    args = ap.parse_args()

    md_path = os.path.abspath(args.file)
    if not os.path.isfile(md_path):
        print(f"File not found: {md_path}", file=sys.stderr)
        sys.exit(2)

    base_dir = os.path.dirname(md_path)
    links = extract_links(md_path)

    internal, external, anchors = [], [], []
    for line, url in links:
        scheme = urlparse(url).scheme.lower()
        if scheme in ("http", "https"):
            external.append((line, url))
        elif scheme in ("mailto", "tel", "javascript", "data", "ftp"):
            continue
        elif url.startswith("#"):
            anchors.append((line, url))
        else:
            internal.append((line, url))

    print(f"🔍 Checking {md_path}")
    print(f"   {len(internal)} internal · {len(external)} external · "
          f"{len(anchors)} anchor-only\n")

    broken = []

    for line, url in internal:
        result = resolve_internal(base_dir, url)
        if result is None:
            broken.append((line, url, "file not found"))
            print(f"  ❌ L{line}  internal  {url}  -> file not found")
        else:
            print(f"  ✅ L{line}  internal  {url}")

    if not args.no_external and external:
        print()
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {ex.submit(check_external, url, args.timeout): (line, url)
                    for line, url in external}
            for fut in as_completed(futs):
                line, url = futs[fut]
                ok, status = fut.result()
                if ok:
                    print(f"  ✅ L{line}  external  [{status}]  {url}")
                else:
                    broken.append((line, url, f"http {status}"))
                    print(f"  ❌ L{line}  external  [{status}]  {url}")
    elif args.no_external and external:
        print(f"\n  (skipped {len(external)} external links: --no-external)")

    print()
    if broken:
        print(f"❗ {len(broken)} broken link(s) in {md_path}:")
        for line, url, reason in sorted(broken):
            print(f"   L{line}  {url}   ({reason})")
        sys.exit(1)
    else:
        print("✅ All links OK")
        sys.exit(0)


if __name__ == "__main__":
    main()
