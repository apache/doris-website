---
{
    "title": "Materialized View Overview",
    "language": "en",
    "description": "What is a Doris materialized view? How do you choose between synchronous and asynchronous, single-table and multi-table, full and incremental refresh? This article provides an overview and selection guidance.",
    "keywords": ["Doris materialized view", "materialized view", "synchronous materialized view", "asynchronous materialized view", "query acceleration", "transparent rewrite", "lakehouse"]
}
---

<!-- Knowledge type: Concept introduction + Selection guide -->
<!-- Applicable scenarios: BI report acceleration, data modeling (DWD/DWM), lakehouse query acceleration -->

A materialized view is an entity that **contains both computation logic and data**. Unlike a regular view, which only stores computation logic without data, a materialized view refreshes data periodically or in real time according to a policy. It can be queried directly, and it can also transparently rewrite queries.

## Reading Notes

Before choosing and using a materialized view, confirm the following questions:

- What problem do you want to solve? Query acceleration, data modeling, or lakehouse acceleration?
- How strict are the data freshness requirements? Do you need strong consistency or eventual consistency?
- Does the defining SQL involve a single table or multiple tables?
- Do you want the refresh to be full, partition-incremental, or real-time?

The following sections address these questions one by one.

<!-- Knowledge type: Use cases -->

## Use Cases for Materialized Views

A materialized view computes and stores data based on its SQL definition, and updates the data periodically or in real time according to a policy. It can be queried directly, and it can also transparently rewrite queries. Common use cases include:

### Query Acceleration

<!-- Applicable scenarios: BI reports, ad-hoc queries -->

In decision support systems (such as BI reports and ad-hoc queries), analytical queries usually contain aggregation operations and may also involve multi-table joins.

-   Computing such query results consumes significant resources, and response times can reach the minute level.
-   Business scenarios often require second-level responses.
-   You can build materialized views to accelerate common queries.

### Lightweight ETL (Data Modeling)

<!-- Applicable scenarios: DWD/DWM data warehouse layer modeling -->

In data layering scenarios, you can use nested materialized views to build the DWD and DWM layers, and use the scheduled refresh capability of materialized views to replace some ETL tasks.

### Lakehouse

<!-- Applicable scenarios: Accelerated queries on external data sources -->

For various external data sources, you can build materialized views on the tables they use, so that you can:

-   Save the cost of importing data from external tables into internal tables.
-   Accelerate queries on external data sources.

<!-- Knowledge type: Classification and selection -->

## Classification of Materialized Views

Materialized views can be classified along three dimensions: **data freshness**, **SQL pattern**, and **refresh method**.

### Classification by Data Freshness: Synchronous vs. Asynchronous

| Category                       | Data Consistency                | Typical Freshness  | Direct Query Support | Applicable Scenarios                            |
| ------------------------------ | ------------------------------- | ------------------ | -------------------- | ----------------------------------------------- |
| Synchronous materialized view  | Strongly consistent with base   | Real-time          | Not supported        | Scenarios with high freshness requirements      |
| Asynchronous materialized view | Eventually consistent with base | T+1 / hourly       | Supported            | General analytical scenarios with looser freshness |

Selection guidance:

-   **High** freshness requirements: choose **synchronous** materialized views.
-   Freshness requirements are **not high** and some delay is acceptable: choose **asynchronous** materialized views.

### Classification by SQL Pattern Supported for Transparent Rewrite: Single-Table vs. Multi-Table

The defining SQL of a materialized view can be either a single-table query or a multi-table query. Based on the number of tables used, materialized views can be divided into single-table materialized views and multi-table materialized views:

-   **Asynchronous materialized views**: support both single-table and multi-table.
-   **Synchronous materialized views**: support only single-table.

### Classification by Refresh Method: Full vs. Partition-Incremental vs. Real-Time

Different categories of materialized views support different refresh methods:

| Materialized View Type         | Full Refresh | Partition-Incremental Refresh | Real-Time Refresh |
| ------------------------------ | ------------ | ----------------------------- | ----------------- |
| Asynchronous materialized view | Supported    | Supported                     | Not supported     |
| Synchronous materialized view  | -            | -                             | Supported         |

Meaning of each refresh method:

-   **Full refresh** (asynchronous): computes all the data of the materialized view's defining SQL.
-   **Partition-incremental refresh** (asynchronous): when data in a base-table partition of the materialized view changes, identifies the corresponding changed partitions and refreshes only those partitions, without refreshing the entire materialized view.
-   **Real-time refresh** (synchronous): can be understood as real-time refresh, always keeping the data consistent with the base table.
