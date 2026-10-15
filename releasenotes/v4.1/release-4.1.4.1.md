---
{
    "title": "Release 4.1.4.1",
    "language": "en",
    "description": "Here's the Apache Doris 4.1.4.1 release notes:"
}
---

Apache Doris 4.1.4.1 is a hotfix release for 4.1.4. It includes everything in 4.1.4 plus the fixes below. For the new features, improvements, and bug fixes in 4.1.4, see the [Apache Doris 4.1.4 release notes](./release-4.1.4.md).

# Bugfix

## Query & Execution

- Fix a BE crash in expressions such as multi-branch `CASE WHEN` when logical `OR` processes nullable Boolean values. (#68401)

## Materialized Views

- Fix partitioned MTMVs performing a full refresh when a base table adds a partition. The refresh now processes only the new partition. (#68237)

## Load & Streaming

- Fix WAL reads with `VARIANT` columns incorrectly failing with an unsupported file-format error. (#68233)

## Platform

- Fix an aarch64 BE startup crash on Linux systems with 64 KiB memory pages by upgrading the bundled libunwind from 1.6.2 to 1.8.3. (#68507)
