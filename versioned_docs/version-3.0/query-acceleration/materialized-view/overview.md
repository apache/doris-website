---
{
    "title": "Materialized View Overview",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Materialized views are entities that store both logical views and data. They differ from logical views, which contain only computational logic and do not store data themselves.

## Use Case

Materialized views compute and store data based on SQL definitions and are updated periodically or in real-time according to strategies. They can be queried directly or used to transparently rewrite queries. They are applicable in the following use cases:

### Query Acceleration

In BI reporting and Ad-Hoc queries, analytical queries often involve aggregation operations and may also require multi-table joins. As these queries can be resource-intensive and may take minutes to complete, while business scenarios often demand sub-second responses, materialized views can be created to accelerate theses common queries.

### ETL (Data Modeling)

In data layering scenarios, nested materialized views can be used to construct DWD and DWM layers, leveraging the scheduling and refresh capabilities of materialized views.

### Lakehousing

For various external data sources, materialized views can be created for the tables used by these sources, thereby saving costs associated with importing data from external to internal tables and accelerating the query process.

## Types of Materialized Views

### Synchronous vs. Asynchronous

- **Sync-materialized views:** require strong consistency with the data in the base tables.

- **Async-materialized views:** maintain eventual consistency with the base table data, potentially with some delay. They are typically used in scenarios where data timeliness is not critical and are often built using T+1 or hourly data. If high timeliness is required, sync-materialized views should be considered.

Currently, sync-materialized views do not support direct querying, while async-materialized views do.

### Single-Table vs. Multi-Table

The SQL definitions of materialized views can include single-table queries or multi-table queries. From the perspective of the number of tables used, materialized views can be classified as single-table or multi-table materialized views.

- Async-materialized views can use either single-table or multi-table queries.

- Sync-materialized views can only use single-table queries.

### Full vs. Partitioned Incremental vs. Real-Time

**For Async-Materialized Views**

- Full Refresh: Computes all data defined by the SQL of the materialized view.

- Partitioned Incremental Refresh: When partition data in the base table of the materialized view changes, it identifies the corresponding changed partitions in the materialized view and refreshes only those partitions, achieving a partitioned incremental refresh without needing to refresh the entire materialized view.

**For Sync-Materialized Views**

- It can be understood as real-time updates, maintaining consistency with the data in the base table.