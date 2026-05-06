---
slug: materialized-view
title: Async Materialized Views
summary: Precompute results, transparently rewrite queries.
related_concepts:
  - async-materialized-view
---

# Async Materialized Views

## What it solves

Dashboards and APIs frequently re-issue the same aggregations over the same data. Caching at the application layer is brittle (invalidation is hard) and pre-aggregating into separate tables forces the application to know which table to query. Async materialized views (AMVs) solve both.

## How it works

You declare an AMV as a SQL definition. Doris maintains it asynchronously — refreshes are scheduled, not synchronous on the base table write — so writes stay fast. At query time, the optimizer recognizes that an AMV can serve a query and rewrites the plan to use it transparently. The application keeps writing the same SQL.

Refresh strategies span full refresh, incremental refresh on partitioned base tables, and triggered refresh based on freshness SLAs.

## When to use it

Use AMVs when you have an expensive query that runs often enough to amortize the maintenance cost. The transparent rewrite means you don't have to coordinate application changes with view changes.

<RelatedConcepts />
