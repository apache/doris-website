# Archived documentation PDFs

The archive list and public download prefix live in `config/archived-docs.json`.
Upload the generated filenames to that prefix before publishing the page. PDFs
are generated locally and are not committed or uploaded by this script.

Install Pandoc, use the repository's Node dependencies, and install the PDF
merger in a virtual environment:

```sh
python3 -m venv tmp/pdfs/.venv
tmp/pdfs/.venv/bin/pip install pypdf
ARCHIVE_PYTHON=tmp/pdfs/.venv/bin/python yarn docs:archive:pdf
```

Set `ARCHIVE_CHROME` to a Chromium/Chrome executable if Puppeteer's bundled
browser is unavailable. For example, on macOS:

```sh
ARCHIVE_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
ARCHIVE_PYTHON=tmp/pdfs/.venv/bin/python yarn docs:archive:pdf
```

The default output is `output/pdf/archived-docs/`. Each version has an English
and a Chinese PDF, ordered by its original sidebar, followed by pages outside
the sidebar. Tabs and collapsed sections are expanded. Cross-document links
and the table of contents point inside the merged PDF. Bookmarks cover every
document. The snapshot includes the source commit and export date.

`manifest.json` records source files, page counts, sizes, SHA-256 hashes, and any
unavailable source images. Missing images are represented by their original
URLs in the PDF and must be reviewed before upload.

Optional environment variables: `ARCHIVE_VERSIONS=2.1`,
`ARCHIVE_LOCALES=en`, `ARCHIVE_OUTPUT=output/pdf/archived-docs`, and
`ARCHIVE_LIMIT=4` (sample export only; use a separate output directory).
Use `ARCHIVE_RESUME=true` when regenerating selected versions while retaining
other PDFs in the same manifest. Resuming requires the same source commit.

Run the source coverage and printing checks with:

```sh
node --test scripts/archive-docs/archive.test.cjs
tmp/pdfs/.venv/bin/python scripts/archive-docs/verify.py output/pdf/archived-docs
```
