---
{
    "title": "DML Plan Tuning: Locating Load and Query Performance Bottlenecks",
    "sidebar_label": "DML Plan Tuning",
    "language": "en",
    "description": "How to tune Doris DML plans? This article explains how to distinguish between load and query bottlenecks, and provides entry points to best practices for both load and query tuning.",
    "keywords": ["Doris DML tuning", "load performance bottleneck", "query performance bottleneck", "DML plan tuning", "Doris load best practices"]
}
---

<!-- Knowledge type: concept + operational guide -->
<!-- Applicable scenario: performance tuning of DML (INSERT / UPDATE / DELETE / load) execution plans -->

## Pre-Tuning Checklist

Before starting DML plan tuning, confirm the following:

-   Whether you can clearly distinguish the time spent in the **load phase** from the time spent in the **query phase**.
-   Whether you have reviewed the Profile / Query Plan to identify the operator or phase with the longest runtime.
-   Whether you have read the [Load Overview](../../../data-operate/import/load-manual.md) to understand the load methods that fit your scenarios.

## Tuning Localization: Load Bottleneck vs Query Bottleneck

<!-- Knowledge type: methodology -->
<!-- Applicable scenario: initial diagnosis of slow DML SQL -->

The performance bottleneck of a DML statement (such as `INSERT INTO ... SELECT`) usually comes from two sources. **The first step is to identify which phase the bottleneck is in**, then tune accordingly.

| Bottleneck Type   | Typical Symptoms                                          | Tuning Entry Point                                                                                                  |
| :---------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| Load-phase bottleneck  | Low write throughput, high time spent on Sink operators       | See the [Load Overview](../../../data-operate/import/load-manual.md) to choose an appropriate load method and best practices |
| Query-phase bottleneck | High time spent on operators such as Scan, Join, and aggregation | See other sections in [Plan Tuning](optimizing-table-schema.md) for diagnosis and tuning                            |

## Load-Side Tuning

<!-- Knowledge type: practical guide -->
<!-- Applicable scenario: efficient loading of the data source in DML -->

Doris supports loading data from a variety of data sources. Using the load capabilities Doris provides flexibly, you can efficiently bring data from different sources into Doris for analysis.

-   **Goal**: Choose a suitable load method based on the data source and timeliness requirements to improve overall DML performance.
-   **Entry point**: [Load Overview](../../../data-operate/import/load-manual.md).
-   **Note**: Load methods include Stream Load, Broker Load, Routine Load, INSERT, and others. See the link above for best practices in detail.

## Query-Side Tuning

<!-- Knowledge type: practical guide -->
<!-- Applicable scenario: tuning the SELECT clause or query execution plan within DML -->

If the bottleneck is in the query phase, follow the other sections of plan tuning to diagnose and optimize, for example, table schema optimization, statistics, join order, and operator rewriting. See [Plan Tuning](optimizing-table-schema.md) for details.

## FAQ

<!-- Knowledge type: frequently asked questions -->
<!-- Applicable scenario: common questions during DML tuning -->

**Q1: How can I quickly tell whether the slowness of a DML statement is in the load phase or the query phase?**
Look at the time spent on each operator in the Profile. If Sink/Load-related operators take a long time, the bottleneck is on the load side. If Scan/Join/Agg operators take a long time, the bottleneck is on the query side.

**Q2: When `INSERT INTO ... SELECT` is slow, which part should I look at first?**
First check whether the SELECT subquery is slow. If running the SELECT alone is fast, the bottleneck is usually on the write side.

**Q3: Do all load methods need to be tuned the same way?**
No. Different load methods (Stream Load, Broker Load, Routine Load, INSERT, and others) require different tuning approaches. See the [Load Overview](../../../data-operate/import/load-manual.md).
