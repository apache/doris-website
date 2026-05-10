---
{
    "title": "Async Materialized View Overview",
    "language": "en",
    "description": "What is a Doris async materialized view? This article introduces the use cases, refresh mechanism, transparent rewriting principles, and lakehouse query acceleration capabilities of async materialized views.",
    "keywords": ["Doris async materialized view", "materialized view", "query acceleration", "transparent rewriting", "lakehouse acceleration", "MTMV"]
}
---

<!-- Knowledge type: concept introduction + capability overview -->
<!-- Use cases: query acceleration, ETL simplification, lakehouse external table query acceleration, write performance optimization -->

An async materialized view is a query acceleration solution that combines the flexibility of a view with the high performance of a physical table. By precomputing and storing query results, subsequent queries can hit the materialized result set directly, avoiding the overhead of repeatedly executing complex SQL.

## Quick Tour

Before using async materialized views, confirm the following points:

- Does the business need query acceleration, ETL simplification, lakehouse external table acceleration, or write optimization?
- Does the query follow the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern?
- Can the data tolerate eventual consistency (non-real-time synchronization)?
- Is the Catalog of the base table within the supported scope (Internal/Hive/Iceberg/Paimon/Hudi/JDBC/ES)?
- Is partitioned incremental refresh needed to lower refresh costs?

## Use Cases

<!-- Knowledge type: scenario description -->

Async materialized views mainly target the following four scenarios:

| Scenario | Value |
| :--- | :--- |
| Query acceleration and concurrency improvement | Significantly improves query speed, enhances concurrency, and reduces resource consumption |
| Simplified ETL workflow | Simplifies the extract, transform, and load (ETL) process and improves development efficiency |
| Accelerated lakehouse external table queries | Significantly improves query speed against external data sources in a lakehouse architecture |
| Improved write efficiency | Reduces resource contention, optimizes the data write process, and ensures consistency and integrity |

## Limitations

<!-- Knowledge type: limitation description -->

Before using async materialized views, be aware of the following limitations:

- **Data consistency**: An async materialized view is eventually consistent with the base table, but it cannot synchronize in real time and does not guarantee real-time consistency.
- **Window functions**: Currently, queries that contain window functions are not supported for transparent rewriting into a form based on materialized views.
- **Multi-table scenarios**: If the materialized view joins more tables than the query involves (for example, the query only involves t1 and t2, while the materialized view contains t1, t2, and t3), transparent rewriting is currently not supported.
- **Operators not supported by transparent rewriting**: If the materialized view contains `UNION ALL`, `LIMIT`, `ORDER BY`, or `CROSS JOIN`, the materialized view can still be built normally, but it cannot be used for transparent rewriting.
- **Data type restrictions**: Creating a materialized view does not currently support the `VARBINARY` type.

## Principles

<!-- Knowledge type: principle description -->

An async materialized view is essentially an internal table of type MTMV. When the materialized view is created, the system also registers a refresh task. When the task runs, it writes the latest data into the materialized view through an `INSERT OVERWRITE` statement.

### Refresh Mechanism

Unlike the real-time incremental refresh of synchronous materialized views, async materialized views provide more flexible refresh options:

| Refresh Mode | Description | Applicable Scenarios |
| :--- | :--- | :--- |
| **Full refresh** | Recomputes all data referenced by the materialized view definition SQL and writes it into the materialized view in full | Small data volume or when overall consistency must be guaranteed |
| **Partitioned incremental refresh** | Intelligently identifies changes in base table partition data and refreshes only the affected partitions | Large data volume with changes concentrated in specific partitions |

- **Full refresh**: Ensures that the materialized view data is fully consistent with the base table, but may consume more compute resources and time.
- **Partitioned incremental refresh**: Significantly reduces the resources and time required for refresh, while ensuring eventual consistency.

### Transparent Rewriting

Transparent rewriting is an important means by which a database optimizes query performance. When processing a user query, the system automatically rewrites the SQL to hit a suitable materialized view, thereby improving execution efficiency and reducing computation costs. The entire process is transparent to the user and requires no intervention.

Doris async materialized views use a transparent rewriting algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) pattern:

1. Performs in-depth analysis of the structural information of the SQL.
2. Automatically finds and selects a suitable materialized view for transparent rewriting.
3. When multiple candidate materialized views exist, selects the optimal materialized view to respond to the query based on strategies such as a cost model, further improving performance.

## Creating an Async Materialized View on a Data Lake

<!-- Use cases: external table acceleration in a lakehouse architecture -->

The syntax for creating an async materialized view on a data lake is identical to creating one on an internal table, but note the following:

- **Metadata source**: The partition version and other information required for materialized view refresh come from the metadata cache of the data lake, not directly from the external environment. Therefore, after the refresh completes, the data is consistent with the result of querying the data lake through Doris, but it may be inconsistent with the results from other engines, depending on how the cache has been refreshed.
- **External change awareness**: If the underlying Hive data is changed by an external process not controlled by Doris (such as a Spark, Hive, or Flink job) but the metadata does not change (for example, when `insert overwrite` is executed), the materialized view will incorrectly consider itself consistent with the base table, but the query results will be inconsistent with the results of querying the data lake through Doris. This issue can be resolved by manually forcing a refresh of the materialized view.
- **Iceberg limitations**: When creating a partitioned materialized view on Iceberg, only Iceberg tables with a single partition column are supported, and partition evolution is supported to a limited extent. For example, changes to the time range of a time-type partition are supported; if the partition field itself changes, the materialized view refresh will fail.
- **Hudi limitations**: When creating a materialized view on Hudi, the system cannot detect whether the base table data has changed. As long as the materialized view (or some of its partitions) has been refreshed, it is considered synchronized with the base table. Therefore, creating a materialized view on Hudi is only suitable for manual on-demand refresh scenarios.

### Materialized View Refresh Support on Data Lakes

The following table shows the level of refresh support for different table types and Catalogs:

<table>
    <tr>
        <th rowspan="2">Table Type</th>
        <th rowspan="2">Catalog Type</th>
        <th colspan="2">Refresh Method</th>
        <th>Refresh Trigger</th>
    </tr>
    <tr>
        <th>Full Refresh</th>
        <th>Partitioned Refresh</th>
        <th>Auto Trigger</th>
    </tr>
    <tr>
        <td>Internal Table</td>
        <td>Internal</td>
        <td>Supported in 2.1</td>
        <td>Supported in 2.1</td>
        <td>Supported in 2.1.4</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>Supported in 2.1</td>
        <td>Supported in 2.1</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>Supported in 2.1</td>
        <td>Supported in 3.1</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>Supported in 2.1</td>
        <td>Supported in 3.1</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>Supported in 2.1</td>
        <td>Supported in 3.1</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>Supported in 2.1</td>
        <td>Not supported</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>Supported in 2.1</td>
        <td>Not supported</td>
        <td>Not supported</td>
    </tr>
</table>

### Transparent Rewriting Support on Data Lakes

The transparent rewriting feature of async materialized views currently supports the following table types and Catalogs.

> **Real-time awareness of base table data**: This means that when the base table data used by the materialized view changes, the materialized view can detect the change in real time and use the latest data in queries.

<table>
    <tr>
        <th>Table Type</th>
        <th>Catalog Type</th>
        <th>Transparent Rewriting Support</th>
        <th>Real-time Awareness of Base Table Data</th>
    </tr>
    <tr>
        <td>Internal Table</td>
        <td>Internal</td>
        <td>Supported</td>
        <td>Supported</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>Supported</td>
        <td>Supported in 3.1</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>Supported</td>
        <td>Supported in 3.1</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>Supported</td>
        <td>Supported in 3.1</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>Supported</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>Supported</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>Supported</td>
        <td>Not supported</td>
    </tr>
</table>

#### Enabling Transparent Rewriting for External Table Materialized Views

When a materialized view uses external tables, it does not participate in transparent rewriting by default. To enable it, run:

```sql
SET materialized_view_rewrite_enable_contain_external_table = true;
```

#### Performance Optimization for External Table Transparent Rewriting

Starting from 2.1.11, Doris has optimized the transparent rewriting performance for external tables, mainly by improving the performance of obtaining available materialized views that contain external tables.

If transparent rewriting on a partitioned materialized view that contains external tables is slow, you can adjust the following parameters in `fe.conf`:

| Parameter | Default | Description | Version |
| :--- | :--- | :--- | :--- |
| `max_hive_partition_cache_num` | 10000 | The maximum number of table-level partition caches in Hive Metastore. When a Hive external table has many partitions, set it to `20000` or higher | - |
| `external_cache_expire_time_minutes_after_access` | 10 minutes | The expiration time of a cached object after its last access. It can be increased appropriately (applies to both external table schema cache and Hive metadata cache) | - |
| `external_cache_refresh_time_minutes` | 10 minutes | The auto-refresh interval of external table metadata cache objects. It can be increased appropriately | 3.1+ |

For more configuration details on external table metadata cache, see [Metadata Cache](../../../lakehouse/meta-cache.md).

## Relationship Between Materialized Views and OLAP Internal Tables

<!-- Knowledge type: implementation mechanism description -->

There is no restriction on the base table model used in the SQL definition of an async materialized view. It can be a Duplicate model, a Unique model (merge-on-write or merge-on-read), an Aggregate model, and so on.

The underlying implementation of the materialized view itself relies on an OLAP table of the Duplicate model and can in theory support all core features of the Duplicate model. However, to ensure that the materialized view can stably and efficiently execute data refresh tasks, a series of necessary restrictions are placed on its functionality:

- **Partition operations**: The partitions of a materialized view are automatically created and maintained based on its base tables. Users cannot perform partition operations on a materialized view.
- **Drop and rename**: Because there are associated jobs (JOB) behind a materialized view, the `DELETE TABLE` or `RENAME TABLE` commands cannot be used to operate on a materialized view. Use the materialized view's own commands to perform the corresponding operations.
- **Column data types**: The column data types of a materialized view are automatically derived from the query statement specified at creation time and cannot be modified, otherwise the refresh task may fail.
- **Property modification**: A materialized view has some properties that a Duplicate table does not have. These must be modified through the materialized view's commands. Other common properties are modified using the `ALTER TABLE` command.

## FAQ

<!-- Knowledge type: Q&A -->

**Q1: Can an async materialized view guarantee real-time data consistency with the base table?**

No. An async materialized view is eventually consistent with the base table, but it cannot synchronize in real time. If real-time consistency is required, consider a synchronous materialized view.

**Q2: Why can a query that contains window functions not be rewritten?**

The current transparent rewriting algorithm does not yet support window functions. Queries that contain window functions are not rewritten into a form based on materialized views.

**Q3: Why is a materialized view based on an external table not hit by rewriting?**

External-table-based materialized views do not participate in transparent rewriting by default. Set `materialized_view_rewrite_enable_contain_external_table = true` to make them participate in rewriting.

**Q4: Why are the materialized view query results inconsistent after Hive external table data is modified by an external process?**

If Hive data is modified by an external process such as Spark, Hive, or Flink but the metadata does not change (for example, `insert overwrite`), the materialized view cannot detect the change. This can be resolved by manually forcing a refresh of the materialized view.

**Q5: Can a materialized view based on Hudi refresh automatically?**

It cannot detect changes in the base table and is only suitable for manual on-demand refresh scenarios.

## See Also

- Create, query, and maintain async materialized views: [Create, Query, and Maintain Async Materialized Views](../async-materialized-view/functions-and-demands.md)
- User guide: [User Guide](../async-materialized-view/use-guide.md)
- FAQ: [FAQ](../async-materialized-view/faq.md)
