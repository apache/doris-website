# Restore distribution downloads

The retired release bucket cannot serve as the source for the new CDN.
Website builds regenerate static site assets. They cannot reproduce an
official binary release and its original signature.

`config/download-recovery.json` records restored distribution objects beneath
`https://assets-cdn.selectdb.com/downloads/releases/`. An empty `objects` map
means none of those objects have passed recovery verification. The download
forms disable unavailable files and their signatures. Existing Apache source,
Maven and other publisher links keep their current behavior.

The documentation renderer migrates old distribution URLs and marks missing
download links unavailable. Download commands remain visible with a notice.
This transformation applies during rendering, so documentation sources and
archived snapshots keep their existing history.

To restore a release file:

1. Obtain the original package, signature and checksum from an independent
   trusted backup or the release publisher. Verify the signature and checksum.
2. Upload each original file to `downloads/releases/<relative-key>` using a
   separate recovery identity. Keep the bucket private, block public access,
   and retain encryption. The website CI role cannot write this prefix.
3. Check the CDN response size and bytes, and verify that anonymous direct OSS
   access returns 403. Verify every sidecar file separately.
4. Add the exact relative key to `objects`, with `verified: true`, the positive
   file size in `bytes`, and its 64-character SHA-256 in `sha256`. Submit that
   catalog change with the release metadata and rebuild the website.

Do not add a catalog entry before verification. Never substitute a source
archive for a link labelled Binary, regenerate an original release signature,
or mark every file available merely because the bucket exists. New releases
using this storage also need verified catalog entries before their download
buttons become available.

Archived documentation PDFs use `downloads/archived-docs/` and are regenerated
from repository snapshots. Their separate workflow and role are documented in
[`scripts/docs-pdf/README.md`](../docs-pdf/README.md).
