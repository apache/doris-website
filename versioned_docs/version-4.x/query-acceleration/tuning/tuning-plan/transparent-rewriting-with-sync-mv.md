---
{
    "title": "Transparent Rewriting with Sync Materialized Views",
    "language": "en",
    "description": "How can you use Doris sync materialized views to enable transparent rewriting and accelerate fixed-dimension aggregation queries on detail tables? This article covers creation steps, hit verification, and best practices.",
    "keywords": ["Doris sync materialized view", "transparent rewriting", "query acceleration", "Sync Materialized View", "aggregation query optimization", "materialized view hit"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenario: performance tuning for fixed-dimension aggregation queries on detail tables -->

A [sync materialized view](../../materialized-view/sync-materialized-view.md) (Sync-Materialized View) is a precomputed table that stores the results of a predefined SELECT statement. It supports both arbitrary-dimension analysis on the original detail data and accelerates aggregation queries on fixed dimensions.

At query time, Doris **automatically matches the optimal materialized view** and reads from it directly. The whole process is transparent to the user, and is called "transparent rewriting." When the data in the base table changes, Doris automatically maintains consistency for the materialized view, with no manual intervention required.

### Prerequisites

- Doris 2.0 or later has been deployed.
- A detail base table already exists, and there are recurring fixed aggregation queries against it.
- You have the database and table privileges needed to create materialized views.
- A test environment is available so that you can verify hit behavior before going to production.

### Applicable Scenarios

<!-- Knowledge type: selection decision -->
<!-- Applicable scenario: deciding whether to use a sync materialized view -->

| Scenario type | Typical characteristics |
| --- | --- |
| Detail and fixed dimensions coexist | You need to query both detail data and fixed aggregations |
| Column / row pruning | Queries access only a small subset of columns or rows of the table |
| Time-consuming operators | Queries contain heavy operations such as long-running aggregations |
| Different prefix indexes | Different prefix indexes are needed to accelerate filtering |

> One-line definition: a sync materialized view = a preaggregation table whose consistency is maintained automatically + transparent rewriting that automatically matches the optimal view.

:::tip Notes
- Doris 2.0 and later versions enhance materialized view functionality. Before going to production, verify in a test environment that the target queries can hit the expected materialized view.
- Avoid creating multiple materialized views with similar shapes on the same table, otherwise they may conflict with each other and cause hit failures.
:::

## Case: Aggregating Sales by Store

<!-- Knowledge type: hands-on example -->
<!-- Applicable scenario: create a sync materialized view from scratch and verify transparent rewriting -->

Assume there is a sales detail table `sales_records` that records the transaction ID, salesperson ID, store ID, sale date, and transaction amount of each sale. A common analytical need is to aggregate sales volume by store.

The following steps create a materialized view `store_amt` that groups by `store_id` and sums sales, and verify that queries are transparently rewritten to this view.

### Step 1: Create the Sync Materialized View

- **Goal**: precompute results for queries that aggregate by store.
- **Command**:

    ```sql
    CREATE MATERIALIZED VIEW store_amt AS
    SELECT store_id, SUM(sale_amt)
    FROM sales_records
    GROUP BY store_id;
    ```

- **Notes**: After submission, Doris builds the materialized view asynchronously in the background, without blocking business queries.

### Step 2: Check the Build Progress

- **Goal**: confirm whether the materialized view has been built.
- **Command**:

    ```sql
    SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name;
    ```

- **Notes**: When the `State` field becomes `FINISHED`, `store_amt` has been created successfully and is eligible to be hit by queries.

### Step 3: Trigger Transparent Rewriting

- **Goal**: let queries that match the aggregation shape automatically go through the materialized view.
- **Command**:

    ```sql
    SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
    ```

- **Notes**: Doris automatically matches `store_amt` and reads the preaggregated data directly, with no SQL changes required.

### Step 4: Verify the Materialized View Is Hit

- **Goal**: confirm that transparent rewriting is in effect.
- **Command**:

    ```sql
    EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
    ```

- **Notes**: Look at the end of the execution plan. If you see the following content, `store_amt` has been hit:

    ```text
    TABLE: default_cluster:test.sales_records(store_amt), PREAGGREGATION: ON
    ```

## Transparent Rewriting vs. Querying the Base Table Directly

<!-- Knowledge type: comparison table -->
<!-- Applicable scenario: evaluate whether introducing a sync materialized view is worthwhile -->

| Comparison dimension | Query the base table directly | Transparent rewriting to a sync materialized view |
| --- | --- | --- |
| Data source | On-the-fly computation over detail data | Direct read of preaggregated results |
| Aggregation query performance | Highly affected by data volume | Significantly improved |
| SQL rewriting cost | None | None (automatic matching) |
| Data consistency | Naturally consistent | Maintained automatically by Doris |
| Maintenance cost | None | Requires planning view shapes to avoid conflicts |

## FAQ

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenario: troubleshoot issues such as materialized view misses, slow builds, and conflicts -->

### Why is my query not hitting the materialized view?

Common causes:

1. The materialized view is still being built, and `State` has not yet become `FINISHED`.
2. The columns, aggregation functions, or grouping keys of the query do not match the materialized view definition.
3. Multiple materialized views with similar shapes exist on the same base table, triggering a conflict that causes the rewrite to fail.

How to investigate: use `EXPLAIN` to inspect the `TABLE: ...(materialized view name)` information at the end of the execution plan, and confirm which table is actually being hit.

### How do I check the materialized view build status?

Run `SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name;` and look at the `State` field:

- `PENDING` / `RUNNING`: the build is in progress.
- `FINISHED`: the build is complete and the view is eligible to be hit.
- `CANCELLED`: the build failed or was cancelled. Investigate the cause and recreate the view.

### Can I create multiple materialized views on a single base table?

Yes, but **avoid similar shapes**. Multiple similar views can prevent transparent rewriting from selecting the optimal view, leading to hit failures. Verify in a test environment that queries can hit the expected view first.

### Do I need to manually sync data to the materialized view?

No. When the data in the base table changes, Doris automatically maintains the consistency of the materialized view.

## Summary

<!-- Knowledge type: key takeaways -->
<!-- Applicable scenario: quickly recap the key conclusions of this article -->

- Sync materialized view = preaggregation table + automatic consistency maintenance + transparent rewriting.
- Suited to scenarios where detail queries and fixed-dimension aggregations coexist.
- After creation, use `EXPLAIN` to verify hits and avoid conflicts among similar views.
- Verify the hit behavior of target queries in a test environment before going to production.
