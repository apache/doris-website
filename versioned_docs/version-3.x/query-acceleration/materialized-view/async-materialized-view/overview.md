---
{
  "title": "Overview of Asynchronous Materialized Views",
  "language": "en"
}
---

Materialized views, as an efficient solution, combine the flexibility of views with the high 
performance advantages of physical tables. 
They can pre-compute and store the result sets of queries, 
allowing for quick retrieval of results directly from the stored materialized view 
when query requests arrive, thus avoiding the overhead of re-executing complex query statements.

## Use Cases

- **Query Acceleration and Concurrency Improvement**: Materialized views can significantly enhance query speed while boosting the system's concurrent processing capabilities, effectively reducing resource consumption.
- **Simplifying ETL Processes**: During the Extract, Transform, Load (ETL) process, materialized views can streamline workflows, improve development efficiency, and make data processing smoother.
- **Accelerating External Table Queries in Lakehouse Architecture**: In a lakehouse architecture, materialized views can significantly enhance the query speed for external data sources, improving data access efficiency.
- **Improving Write Efficiency**: By reducing resource contention, materialized views can optimize the data writing process, enhance write efficiency, and ensure data consistency and integrity.

## Limitations
- **Consistency of Asynchronous Materialized Views with Base Table Data**: Asynchronous materialized views will eventually be consistent with the base table data, but they cannot be synchronized in real-time, meaning real-time consistency cannot be maintained.
- **Support for Window Function Queries**: Currently, if a query contains window functions, it is not supported to transparently rewrite that query to utilize materialized views.
- **Materialized Views Joining More Tables than Query Tables**: If the number of tables joined in the materialized view exceeds the number of tables involved in the query (for example, if the query only involves t1 and t2, while the materialized view includes t1, t2, and an additional t3), the system currently does not support transparently rewriting that query to utilize the materialized view.
- If the materialized view contains set operations such as UNION ALL, LIMIT, ORDER BY, or CROSS JOIN, the materialized view can be built normally, but it cannot be used for transparent rewriting.

## Principle Introduction

Materialized views, as an advanced feature in databases, essentially function as MTMV-type internal tables. When creating a materialized view, the system simultaneously registers a refresh task. This task will run when needed, executing an INSERT OVERWRITE statement to write the latest data into the materialized view.

**Refresh Mechanism**  
Unlike the real-time incremental refresh used by synchronous materialized views, asynchronous materialized views offer more flexible refresh options.

- **Full Refresh**:  
  In this mode, the system recalculates all data involved in the SQL definition of the materialized view and writes the complete results into the materialized view. This process ensures that the data in the materialized view remains consistent with the base table data, but it may consume more computational resources and time.

- **Partition Incremental Refresh**:  
  When the partition data of the base table for the materialized view changes, the system can intelligently identify these changes and refresh only the affected partitions. This mechanism significantly reduces the computational resources and time required to refresh the materialized view while ensuring eventual data consistency.

**Transparent Rewriting**:  
Transparent rewriting is an important means for databases to optimize query performance. When processing user queries, the system can automatically optimize and rewrite the SQL to improve execution efficiency and reduce computational costs. This rewriting process is transparent to the user, requiring no intervention.

Doris asynchronous materialized views utilize a transparent rewriting algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) model. This algorithm can deeply analyze the structural information of SQL, automatically searching for and selecting suitable materialized views for transparent rewriting. When multiple materialized views are available, the algorithm will also choose the optimal materialized view to respond to the query SQL based on certain strategies (such as cost models), further enhancing query performance.

## Support for Materialized Refresh Data Lake

The support for materialized refresh data lakes varies by table type and catalog.

<table>
    <tr>
        <th rowspan="2">Table Type</th>
        <th rowspan="2">Catalog Type</th>
        <th colspan="2">Refresh Method</th>
        <th>Triggered Refresh</th>
    </tr>
    <tr>
        <th>Full Refresh</th>
        <th>Partition Refresh</th>
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
        <td>Not supported</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>Supported in 2.1</td>
        <td>Not supported</td>
        <td>Not supported</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>Supported in 2.1</td>
        <td>Not supported</td>
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

## Transparent Rewriting Support for Data Lake
Currently, the transparent rewriting feature of asynchronous materialized views supports the following types of tables and catalogs.

Real-time Base Table Data Awareness: Refers to the materialized view's ability to detect changes in the underlying table data it uses and utilize the latest data during queries.

<table>
    <tr>
        <th>Table Type</th>
        <th>Catalog Type</th>
        <th>Transparent Rewriting Support</th>
        <th>Real-time Base Table Data Awareness</th>
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
        <td>3.1 Supported</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>Supported</td>
        <td>3.1 Supported</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>Supported</td>
        <td>3.1 Supported</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>Supported</td>
        <td>3.1 Supported</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>Supported</td>
        <td>Not Supported</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>Supported</td>
        <td>Not Supported</td>
    </tr>
</table>

Materialized views using external tables do not participate in transparent rewriting by default, because they cannot detect changes in external table data and cannot guarantee the data in the materialized view is up-to-date.
If you want to enable transparent rewriting for materialized views containing external tables, you can set `SET materialized_view_rewrite_enable_contain_external_table = true`.

Since version 2.1.11, Doris has optimized the transparent rewriting performance for external tables, mainly improving the performance of obtaining available materialized views containing external tables.

For partitioned materialized views containing external tables, if transparent rewriting is slow, you need to configure in fe.conf:
`max_hive_partition_cache_num = 20000`, the maximum number of Hive Metastore table-level partition caches, with a default value of 10000.
If the external Hive table has many partitions, you can set this value higher.

`external_cache_expire_time_minutes_after_access`, the duration after last access when cache expires. Default is 10 minutes, can be appropriately increased.
(Applies to external table schema cache and Hive metadata cache)

`external_cache_refresh_time_minutes = 60`, the automatic refresh interval for external table metadata cache. Default is 10 minutes, can be appropriately increased. This configuration is supported starting from version 3.1.
For details about external table metadata cache configuration, see [Metadata Cache](../../../lakehouse/meta-cache.md)

## Relationship Between Materialized Views and OLAP Internal Tables

Asynchronous materialized views define SQL using the base table's table model without restrictions, which can be detail models, primary key models (merge-on-write and merge-on-read), aggregate models, etc.

The underlying implementation of materialized views relies on OLAP tables of the Duplicate model, which theoretically allows them to support all core functionalities of the Duplicate model. However, to ensure that materialized views can execute data refresh tasks stably and efficiently, we have imposed a series of necessary restrictions on their functionality. The specific restrictions are as follows:

- The partitions of materialized views are automatically created and maintained based on their base tables, so users cannot perform partition operations on materialized views.
- Since there are related jobs (JOB) that need to be processed behind materialized views, commands like DELETE TABLE or RENAME TABLE cannot be used to operate on materialized views. Instead, the commands specific to the materialized view must be used for these operations.
- The column data types of materialized views are automatically inferred based on the query statement specified at creation, so these data types cannot be modified. Otherwise, it may lead to failures in the refresh tasks of the materialized view.
- Materialized views have some properties that Duplicate tables do not possess, and these properties need to be modified through the commands of the materialized view. Other common properties should be modified using the ALTER TABLE command.

## More References
For creating, querying, and maintaining asynchronous materialized views, you can refer to [Creating, Querying, and Maintaining Asynchronous Materialized Views](../async-materialized-view/functions-and-demands.md).

For best practices, you can refer to [Best Practices](../async-materialized-view/use-guide.md).

For frequently asked questions, you can refer to [Frequently Asked Questions](../async-materialized-view/faq.md).