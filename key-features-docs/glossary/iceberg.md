---
slug: iceberg
title: Apache Iceberg
summary: Open table format for huge analytic datasets, with hidden partitioning and full schema evolution.
tags: [lakehouse, file-format]
---

# Apache Iceberg

<TagChips />

Apache Iceberg is an open table format designed for petabyte-scale analytics. It separates the *table* concept (a stable name with schema and metadata) from the *file layout* (Parquet/ORC files in object storage), allowing safe schema and partition evolution without rewriting data.

## What makes it different

- **Hidden partitioning**: queries don't need to specify partition predicates; Iceberg derives them from filter columns.
- **Snapshot isolation**: every write produces a new immutable snapshot, enabling time-travel queries and atomic rollbacks.
- **Full schema evolution**: add, drop, rename, or reorder columns without rewriting files.

## In Doris

Doris reads Iceberg tables directly via the multi-catalog interface. Predicate pushdown extends down to Iceberg's metadata layer, so partition pruning and file skipping happen before any data is read.

<RelatedConcepts ids={['hudi']} />
