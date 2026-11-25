# Distribution downloads

Doris package, signature and checksum links use the public-read release mirror:

```text
https://apache-doris-downloads.oss-accelerate.aliyuncs.com/<relative-key>
```

The original object keys are preserved at the bucket root. Configure OSS
transfer acceleration for this bucket and keep writes restricted to the owner
and explicitly authorized publishing or replication identities.

`config/download-recovery.json` declares this base URL and sets
`availability` to `public`. Download forms enable the configured package and
sidecar links without requiring a manually maintained receipt for every object.
This setting controls link availability; it does not assert that a particular
file has passed signature verification. Complete and check the bucket migration
before deploying the endpoint change. An absent signature or checksum URL in
release metadata still leaves that particular action disabled.

The release catalogue in `src/constant/download.data.ts` and the add-release
validator use the same endpoint. Apache source, Maven, GitHub and other
publisher URLs retain their existing behavior.

The documentation renderer rewrites retired distribution URLs to this mirror
without changing documentation sources or archived snapshots. In public mode,
these links and commands no longer receive the temporary unavailable notice.
Archived documentation PDFs keep the independent base URL in
`config/archived-docs.json`; changing the distribution bucket does not move them.

## Verified recovery mode

For a staged recovery, set `availability` to `verified` (or omit it) and record
each recovered relative key in `objects`, with `verified: true`, a positive
file size in `bytes`, and its 64-character SHA-256 in `sha256`. Missing or
incomplete receipts keep that file and its corresponding action unavailable.
Each package, signature and checksum is checked separately.

Obtain original release files from the publisher or a trusted backup. Verify
published checksums and signatures before publishing or restoring them. Website
builds cannot reproduce an official release binary and its original signature.
Keep recovery and publisher write permissions separate from website publishing:
the website CI role can upload only the website assets prefix, not release
files. The website link configuration does not grant OSS write permissions.

Never substitute a source archive for a link labelled Binary, or reuse an
original signature for a different rebuilt package.
