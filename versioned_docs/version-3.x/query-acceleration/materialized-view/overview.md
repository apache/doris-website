---
{
    "title": "Materialized View Overview",
    "language": "en",
    "description": "Materialized views are entities that contain both computation logic and data. Unlike views,"
}
---

Materialized views are entities that contain both computation logic and data. Unlike views, which only contain computation logic and do not store data themselves, materialized views do.

## Use Cases for Materialized Views

Materialized views calculate and store data based on SQL definitions and update periodically or in real-time according to policies. They can be queried directly or used for transparent query rewriting. They are applicable in the following scenarios:

### Query Acceleration

In decision support systems, such as BI reports and ad-hoc queries, these analytical queries often involve aggregation operations and may include multi-table joins. Since calculating the results of such queries can be resource-intensive and response times may reach minutes, while business scenarios often require second-level responses, materialized views can be constructed to accelerate common queries.

### Lightweight ETL (Data Modeling)

In data layering scenarios, nested materialized views can be used to construct DWD and DWM layers, leveraging the scheduling and refresh capabilities of materialized views.

### Lakehouse Integration

For multiple external data sources, materialized views can be constructed for the tables used by these data sources to save costs from importing external tables to internal tables and accelerate the query process.

## Classification of Materialized Views

### Classified by Data Timeliness: Synchronous vs Asynchronous

- Synchronous materialized views need to maintain strong consistency with the base table data.

- Asynchronous materialized views maintain eventual consistency with the base table data and may have some delay. They are typically used in scenarios where data timeliness is not critical, often using T+1 or hourly data to construct materialized views. If high timeliness is required, consider using synchronous materialized views.

Currently, synchronous materialized views do not support direct queries, while asynchronous materialized views do.

### Classified by SQL Mode Supporting Transparent Rewriting: Single Table vs Multi-Table

The SQL definition of a materialized view can include single-table queries or multi-table queries. From the perspective of the number of tables used, materialized views can be classified as single-table or multi-table materialized views.

- For asynchronous materialized views, both single-table and multi-table can be used.

- For synchronous materialized views, only single-table can be used.

### Classified by Materialized View Refresh: Full Refresh vs Partition Incremental Refresh vs Real-Time Refresh

**For Asynchronous Materialized Views**

- Full Refresh: Computes all data of the materialized view's SQL definition.

- Partition Incremental Refresh: When the partition data of the base table of the materialized view changes, it identifies the partitions of the materialized view that correspond to the changes and only refreshes those partitions, achieving partition incremental refresh without refreshing the entire materialized view.

**For Synchronous Materialized Views**

- Can be understood as real-time refresh, maintaining consistency with the base table data.