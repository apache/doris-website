#!/usr/bin/env python3

import argparse
import hashlib
import itertools
from pathlib import Path


VERSION_DIRS = {
    "2.1": Path("versioned_docs/version-2.1"),
    "3.x": Path("versioned_docs/version-3.x"),
    "4.x": Path("versioned_docs/version-4.x"),
    "current": Path("docs"),
}

DOC_SUFFIXES = {".md", ".mdx"}


def md5_of_file(path: Path, chunk_size: int = 8192) -> str:
    digest = hashlib.md5()
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def build_top_dir_map(base_dir: Path) -> dict[str, dict[str, str]]:
    """
    Return:
      {
        "<top_dir>": {
          "<relative/path/under/top_dir.md>": "<md5>"
        }
      }
    """
    result: dict[str, dict[str, str]] = {}
    for file_path in base_dir.rglob("*"):
        if not file_path.is_file() or file_path.suffix.lower() not in DOC_SUFFIXES:
            continue
        rel = file_path.relative_to(base_dir)
        parts = rel.parts
        if not parts:
            continue
        top_dir = parts[0]
        inner_path = str(Path(*parts[1:])) if len(parts) > 1 else rel.name
        result.setdefault(top_dir, {})[inner_path] = md5_of_file(file_path)
    return result


def compare_two_versions(
    left_name: str,
    right_name: str,
    left_map: dict[str, dict[str, str]],
    right_map: dict[str, dict[str, str]],
) -> dict[str, object]:
    common_dirs = sorted(set(left_map.keys()) & set(right_map.keys()))

    identical_dirs: list[str] = []
    non_identical_details: list[tuple[str, int, int, int]] = []
    # (dir_name, files_in_left, files_in_right, common_same_files)

    for dir_name in common_dirs:
        left_docs = left_map[dir_name]
        right_docs = right_map[dir_name]

        if left_docs == right_docs:
            identical_dirs.append(dir_name)
            continue

        common_files = set(left_docs.keys()) & set(right_docs.keys())
        common_same = sum(
            1 for rel_path in common_files if left_docs[rel_path] == right_docs[rel_path]
        )
        non_identical_details.append(
            (dir_name, len(left_docs), len(right_docs), common_same)
        )

    return {
        "pair": (left_name, right_name),
        "common_dir_count": len(common_dirs),
        "identical_dirs": identical_dirs,
        "non_identical_details": sorted(non_identical_details, key=lambda x: x[0]),
    }


def render_report(
    version_maps: dict[str, dict[str, dict[str, str]]],
    pair_results: list[dict[str, object]],
) -> str:
    lines: list[str] = []
    lines.append("Version Docs MD5 Directory Consistency Report")
    lines.append("=" * 48)
    lines.append("")
    lines.append("Scope:")
    for name, path in VERSION_DIRS.items():
        lines.append(f"- {name}: {path}")
    lines.append("")
    lines.append("Rule:")
    lines.append(
        "- A top-level directory is IDENTICAL only when both versions contain the same .md/.mdx files and every corresponding file has the same MD5."
    )
    lines.append("")

    lines.append("Per-version top-level directory stats:")
    for ver in ["2.1", "3.x", "4.x", "current"]:
        total_dirs = len(version_maps[ver])
        total_docs = sum(len(v) for v in version_maps[ver].values())
        lines.append(f"- {ver}: {total_dirs} dirs, {total_docs} docs")
    lines.append("")

    lines.append("Pairwise comparison results:")
    for item in pair_results:
        left_name, right_name = item["pair"]  # type: ignore[misc]
        common_dir_count = item["common_dir_count"]  # type: ignore[misc]
        identical_dirs = item["identical_dirs"]  # type: ignore[misc]
        non_identical_details = item["non_identical_details"]  # type: ignore[misc]

        lines.append("")
        lines.append(f"[{left_name} vs {right_name}]")
        lines.append(f"- Common top-level dirs: {common_dir_count}")
        lines.append(f"- Identical dirs: {len(identical_dirs)}")

        if identical_dirs:
            lines.append("- Identical dir list:")
            for d in identical_dirs:
                lines.append(f"  - {d}")
        else:
            lines.append("- Identical dir list: (none)")

        lines.append(f"- Non-identical dirs: {len(non_identical_details)}")
        if non_identical_details:
            lines.append(
                "  (format: dir_name | file_count_left | file_count_right | same_md5_in_common_paths)"
            )
            for d, left_count, right_count, same_common in non_identical_details:
                lines.append(
                    f"  - {d} | {left_count} | {right_count} | {same_common}"
                )

    lines.append("")
    lines.append("Directories identical across all 4 versions:")
    common_all = set(version_maps["2.1"].keys())
    common_all &= set(version_maps["3.x"].keys())
    common_all &= set(version_maps["4.x"].keys())
    common_all &= set(version_maps["current"].keys())

    all_identical = []
    for d in sorted(common_all):
        v21 = version_maps["2.1"][d]
        v3x = version_maps["3.x"][d]
        v4x = version_maps["4.x"][d]
        cur = version_maps["current"][d]
        if v21 == v3x == v4x == cur:
            all_identical.append(d)

    lines.append(f"- Common dirs in all versions: {len(common_all)}")
    lines.append(f"- Fully identical across all versions: {len(all_identical)}")
    if all_identical:
        for d in all_identical:
            lines.append(f"  - {d}")

    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Compare docs directories (2.1, 3.x, 4.x, current) by per-file MD5 and "
            "report identical top-level directories."
        )
    )
    parser.add_argument(
        "--output",
        default="md5_version_dirs_consistency_report.txt",
        help="Output report file path.",
    )
    args = parser.parse_args()

    version_maps: dict[str, dict[str, dict[str, str]]] = {}
    for name, base_dir in VERSION_DIRS.items():
        if not base_dir.exists():
            raise FileNotFoundError(f"Version dir not found: {base_dir}")
        version_maps[name] = build_top_dir_map(base_dir)

    pair_results = []
    for left_name, right_name in itertools.combinations(VERSION_DIRS.keys(), 2):
        pair_results.append(
            compare_two_versions(
                left_name, right_name, version_maps[left_name], version_maps[right_name]
            )
        )

    report = render_report(version_maps, pair_results)
    output_path = Path(args.output)
    output_path.write_text(report, encoding="utf-8")
    print(f"Report written to: {output_path}")


if __name__ == "__main__":
    main()
