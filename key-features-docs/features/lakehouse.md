---
slug: lakehouse
title: Lakehouse
summary: Query Iceberg, Hudi, and Paimon directly without ETL.
related_concepts:
  - iceberg
  - hudi
---

# Lakehouse

## What it solves

The "lakehouse" idea promises one storage layer that serves both analytical and operational workloads. In practice it requires three things: open table formats, compute that reads them at native speed, and federation across the catalogs your organization already uses. Doris provides all three as first-class capabilities — not bolt-on connectors.

## How it works

Doris reads Iceberg, Hudi, and Paimon tables directly from object storage. Catalog federation lets a single SQL query span Hive Metastore, AWS Glue, and Iceberg REST catalogs without staging data. Predicate pushdown reaches into Parquet and ORC scan layers; partition pruning and statistics-driven file skipping keep wide-table scans bounded.

For incremental workloads, Doris materializes hot subsets into native tables while leaving the cold tail on the lake. The same query planner decides at runtime which path to take.

## When to use it

Choose this when your data already lives in an open table format and you want analytical SQL without copying it. Especially valuable when you have multiple teams reading from different catalogs.

<RelatedConcepts />
