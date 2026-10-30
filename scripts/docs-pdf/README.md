# Export documentation to PDF locally

Generate the documentation for a selected version from this checkout. The
command reads local Markdown/MDX and version sidebars, so you can export Dev,
active releases, or historical versions without building or deploying the site.
Remote images are downloaded and embedded; uploading the finished PDF is a
separate step. The working tree is exported, including uncommitted documentation
edits; the recorded source commit identifies the checkout base.

## Setup

Requirements: Node.js 20+, Python 3.10+, Pandoc, curl, and a recent Chrome or
Chromium. Install a Chinese font such as Noto Sans CJK when exporting Chinese
on Linux. macOS can use its system Chinese fonts.

```sh
yarn install --frozen-lockfile
python3 -m venv tmp/pdfs/.venv
tmp/pdfs/.venv/bin/python -m pip install -r scripts/docs-pdf/requirements.txt
```

The command detects this virtual environment and common Chrome/Chromium paths.
Use `--python` and `--chrome` to select other executables. Chrome's normal
sandbox remains enabled; a Linux sandbox error needs a working local browser
installation and OS sandbox configuration.

## Export a version

The shell wrapper locates the repository root and accepts the version and
optional language as positional arguments:

```sh
./scripts/docs-pdf/generate.sh 4.x
./scripts/docs-pdf/generate.sh dev zh-CN
./scripts/docs-pdf/generate.sh 2.1 en --output ./output/pdf/2.1-english
./scripts/docs-pdf/generate.sh --list-versions
```

It also accepts the original `--version` and `--locale` flags and forwards
additional options unchanged. You can invoke it by its path from another
directory; relative option paths are resolved from the repository root.

The Yarn command is also available directly:

```sh
# Discover the versions present in this checkout.
yarn docs:pdf --list-versions

# Export both English and Chinese for 4.x.
yarn docs:pdf --version 4.x

# Export only Chinese for Dev (current is an alias for dev).
yarn docs:pdf --version dev --locale zh-CN

# Export a historical version to a chosen directory.
yarn docs:pdf --version 2.1 --locale en --output ./output/pdf/2.1-english

# Explicit browser/interpreter selection, if needed.
yarn docs:pdf --version 3.x --locale zh-CN \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --python tmp/pdfs/.venv/bin/python
```

By default, output goes to `output/pdf/docs/<version>/`:

- `apache-doris-<version>-en.pdf` and/or `apache-doris-<version>-zh-CN.pdf`
- `manifest.json`: source commit, selected source files, document/page counts,
  sample status, image warnings, file sizes, and SHA-256 hashes
- `SHA256SUMS`: checksums for the PDFs listed in the manifest

The PDF has a cover, clickable contents, document bookmarks, internal links,
and page numbers. Source pages follow sidebar order, with pages outside the
sidebar appended. All Tab content and collapsed details are expanded.
Navigation cards retain their titles, descriptions, and links; animations are
represented by links to the online resource. Unsupported MDX components fail
with their source filename instead of silently dropping content.

The selected locale source directory must exist. Supported languages are
`en` and `zh-CN`. Unknown versions, locales, and options fail before creating
output. The tool requires no OSS credentials and performs no upload.

## Samples, retries, and verification

```sh
# A small sample: the explicit output directory prevents replacing a full PDF.
yarn docs:pdf --version 4.x --locale zh-CN --limit 3 \
  --output ./tmp/pdfs/4.x-sample

# Preserve other locales in the manifest when regenerating a selection.
yarn docs:pdf --version 4.x --locale en --resume

# Check hashes, counts, bookmarks, internal links, and sample extracted text.
tmp/pdfs/.venv/bin/python scripts/docs-pdf/verify.py output/pdf/docs/4.x

# Run the command/inventory/content conversion tests.
node --test scripts/docs-pdf/docs-pdf.test.cjs
```

`--limit` produces a partial sample and records `sample: true` in the manifest.
`--resume` requires the same source commit as the existing manifest. Temporary
render batches and cached images live under `tmp/pdfs/docs/<version>/`.

Missing images fail the export by default. Retry after fixing the network or
source image. `--allow-missing-images` explicitly permits linked placeholders
and records them in the manifest; review those warnings before distributing
the result. The verifier also requires `--allow-missing-images` to accept them.
PDF files are replaced only after their render batches merge successfully.

The retired scheduled workflow was `.github/workflows/cron-generate-pdf.yml`.
