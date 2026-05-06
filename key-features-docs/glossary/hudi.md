---
slug: hudi
title: Apache Hudi
summary: Lakehouse table format optimized for streaming ingest and incremental processing.
tags: [lakehouse, ingestion, file-format]
---

# Apache Hudi

<TagChips />

Apache Hudi is an open table format that brings transactional semantics — upserts, deletes, and incremental queries — to data lake storage. Where Iceberg emphasizes analytical correctness and schema evolution, Hudi emphasizes streaming write patterns and near-real-time freshness.

## Two table types

- **Copy-on-Write (CoW)**: rewrites entire files on update; reads are pure Parquet (fast, no merge cost).
- **Merge-on-Read (MoR)**: writes deltas to log files, merged at query time (faster ingest, slower scan).

## In Doris

Doris supports both CoW and MoR Hudi tables via the multi-catalog interface. For MoR tables, the merge happens transparently during scan.

<RelatedConcepts ids={['iceberg']} />
