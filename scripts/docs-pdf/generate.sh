#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage:
  ./scripts/docs-pdf/generate.sh <version> [locale] [options]
  ./scripts/docs-pdf/generate.sh --version <version> [options]
  ./scripts/docs-pdf/generate.sh --list-versions

Examples:
  ./scripts/docs-pdf/generate.sh 4.x zh-CN
  ./scripts/docs-pdf/generate.sh dev
  ./scripts/docs-pdf/generate.sh 2.1 en --output ./output/pdf/2.1-english

Locale: en, zh-CN, or en,zh-CN. Omit it to export both languages.
Additional options are passed to yarn docs:pdf.
Relative paths are resolved from the repository root.
Run yarn docs:pdf --help for the complete option list.
EOF
}

case "${1:-}" in
    '') usage >&2; exit 2 ;;
    -h|--help) usage; exit 0 ;;
esac

docs_pdf_repo_root="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"

if [[ "$1" != -* ]]; then
    docs_pdf_version="$1"
    shift
    if (( $# > 0 )) && [[ "$1" != -* ]]; then
        docs_pdf_locale="$1"
        shift
        set -- --version "$docs_pdf_version" --locale "$docs_pdf_locale" "$@"
    else
        set -- --version "$docs_pdf_version" "$@"
    fi
fi

if ! command -v yarn >/dev/null 2>&1; then
    printf 'yarn is required to run the documentation PDF exporter.\n' >&2
    exit 127
fi

cd -- "$docs_pdf_repo_root"
exec yarn docs:pdf "$@"
