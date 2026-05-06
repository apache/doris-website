---
slug: async-materialized-view
title: Async Materialized View
summary: Precomputed query result that is refreshed asynchronously and used to transparently accelerate matching queries.
tags: [query-engine, mechanism]
---

# Async Materialized View

<TagChips />

An async materialized view (AMV) is a database object that stores the result of a SQL query and refreshes it asynchronously, decoupled from base-table writes. At query time, the optimizer can detect that a user query is structurally subsumed by an AMV's definition and rewrite the plan to read from the AMV instead — without the application changing its SQL.

## Refresh strategies

- **Full refresh**: re-runs the entire definition.
- **Incremental refresh**: only recomputes the changed partitions/rows on the base tables.
- **Triggered refresh**: refresh fires when a freshness threshold is breached.

## Why "async"

Synchronous materialized views (rewriting on every base-table commit) impose latency on writes. Async refresh keeps writes fast, at the cost of bounded staleness.

<RelatedConcepts />
