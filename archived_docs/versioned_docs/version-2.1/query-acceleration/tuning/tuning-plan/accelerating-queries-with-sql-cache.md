---
{
    "title": "Accelerating Queries with SQL Cache",
    "language": "en",
    "description": "For the detailed implementation principle of SQL Cache, please refer to the chapter SQL Cache."
}
---

## Overview
For the detailed implementation principle of SQL Cache, please refer to the chapter [SQL Cache](../../../query-acceleration/sql-cache-manual).

## Case
For detailed cases, please refer to the chapter [SQL Cache](../../../query-acceleration/sql-cache-manual).

## Summary
SQL Cache is a query optimization mechanism provided by Doris, which can significantly improve query performance. When using it, the following points should be noted:

:::tip Note
- SQL Cache is not suitable for queries containing functions that generate random values (such as `random()`), as this will cause the query results to lose randomness.
- Currently, it does not support using the cached results of some metrics to meet the needs of querying more metrics. For example, the cache for previously queried two metrics cannot be used for the situation of querying three metrics.
- By reasonably using SQL Cache, the query performance of Doris can be significantly improved, especially in scenarios with a low data update frequency. In practical applications, cache parameters need to be adjusted according to specific data characteristics and query patterns to achieve the best performance improvement.
  ::: 