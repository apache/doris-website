---
{
    "title": "Use Guide",
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

## Usage Guidelines

1. **Consideration of Timeliness:** Asynchronous materialized views are typically used in scenarios where there are low requirements for data timeliness, often involving T+1 data. If high timeliness is crucial, consider using synchronous materialized views instead.
2. **Balancing Acceleration and Consistency**: When creating materialized views for query acceleration, DBAs should group common query SQL patterns, aiming for minimal overlap between groups. Clearer partitioning of SQL patterns leads to higher-quality materialized view construction. A single query may leverage multiple materialized views, and conversely, a single materialized view may be utilized by multiple queries. The decision to construct a materialized view should weigh factors such as response time improvements (acceleration effects), construction costs, and data consistency requirements.

3. **Considerations of Costs:**
   
   - The closer the materialized view definition aligns with the original query, the better the query acceleration effect, but this reduces the view's versatility and reusability, translating to higher construction costs.
   
   - More generic materialized view definitions (e.g., without WHERE conditions and more aggregation dimensions) may offer lower query acceleration but improved versatility and reusability, leading to lower construction costs.

Note:

1. Control the Number of Materialized Views: More materialized views do not necessarily equate to better performance. Materialized views participate in transparent rewriting, and the CBO cost model takes time to select the optimal one. In theory, an increased number of materialized views lengthens the time required for transparent rewriting and consumes more resources during construction and refresh.

2. Regularly Check Materialized View Usage: Unused materialized views should be promptly deleted.

3. Base Table Data Update Frequency: Frequent updates to the base tables of materialized views may not be suitable for their use, as it can lead to frequent invalidation and render them ineffective for transparent rewriting (though direct querying is still possible). If transparent rewriting is necessary, consider accepting a certain delay in data freshness and configuring a `grace_period`. Refer to the applicable instructions for `grace_period` for more details.

## Principles of Refresh Methods

When the following conditions are met, it is recommended to create a partitioned materialized view:

- The base table of the materialized view has a large amount of data, and the base table is partitioned.

- Tables used by the materialized view, excluding partitioned tables, do not change frequently.

- The SQL definition of the materialized view and partition fields meet the requirements for partition derivation, i.e., they satisfy the requirements for incremental partition updates. Detailed requirements can be found in: [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW/#refreshmetho)

- The number of partitions in the materialized view is not excessive.

When some partitions of the materialized view become invalid, transparent rewriting can use the valid partitions of the materialized view `UNION ALL` the base table to return data. If a partitioned materialized view cannot be constructed, consider selecting a fully refreshed materialized view instead.

## Usage of Partitioned Materialized Views

When the base table of the materialized view has a large amount of data and is partitioned, and if the SQL definition and partition fields of the materialized view meet the requirements for partition derivation, this scenario is suitable for constructing a partitioned materialized view. Detailed requirements for partition derivation can be found in [CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW/#refreshmethod) and [FAQ question 12 in the async-materialized view section](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-encountered-when-building-a-partitioned-materialized-view).

The partitions of the materialized view are created following the partition mapping of the base table, generally in a 1:1 or 1:n relationship with the base table partitions.

- If data changes occur in the partitions of the base table, such as adding or deleting partitions, the corresponding partitions of the materialized view will also become invalid. Invalid partitions cannot be used for transparent rewriting but can be queried directly. When transparent rewriting finds that a partition of the materialized view is invalid, the invalid partition will respond to queries by joining with the base table.

    The command to check the partition status of the materialized view is detailed in Checking the Status of Materialized Views, primarily using the `show partitions from mv_name` command.

- If data changes occur in non-partitioned tables referenced by the materialized view, it will trigger all partitions of the materialized view to become invalid, rendering the materialized view unusable for transparent rewriting. It is necessary to refresh the data of all partitions of the materialized view using the command `REFRESH MATERIALIZED VIEW mv1 AUTO;`. This command attempts to refresh the materialized view, performing incremental partition construction if the conditions for incremental partition construction are met, otherwise falling back to full construction.

    Therefore, it is generally recommended to place tables with frequent data changes in the partitioned tables referenced by the partitioned materialized view and place infrequently changing dimension tables in non-referenced partitioned tables.

Transparent rewriting of partitioned materialized views is partition-granular. Even if some partitions of the materialized view are invalid, the materialized view can still be used for transparent rewriting. However, if only one partition is queried and the partition data of the materialized view is invalid, the materialized view cannot be used for transparent rewriting.

Example 1:

```sql
  CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey INTEGER NOT NULL, 
    l_partkey INTEGER NOT NULL, 
    l_suppkey INTEGER NOT NULL, 
    l_linenumber INTEGER NOT NULL, 
    l_ordertime DATETIME NOT NULL, 
    l_quantity DECIMALV3(15, 2) NOT NULL, 
    l_extendedprice DECIMALV3(15, 2) NOT NULL, 
    l_discount DECIMALV3(15, 2) NOT NULL, 
    l_tax DECIMALV3(15, 2) NOT NULL, 
    l_returnflag CHAR(1) NOT NULL, 
    l_linestatus CHAR(1) NOT NULL, 
    l_shipdate DATE NOT NULL, 
    l_commitdate DATE NOT NULL, 
    l_receiptdate DATE NOT NULL, 
    l_shipinstruct CHAR(25) NOT NULL, 
    l_shipmode CHAR(10) NOT NULL, 
    l_comment VARCHAR(44) NOT NULL
  ) DUPLICATE KEY(
    l_orderkey, l_partkey, l_suppkey, 
    l_linenumber
  ) PARTITION BY RANGE(l_ordertime) (
    FROM 
      ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
  ) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3 PROPERTIES ("replication_num" = "1"); 
  
    insert into lineitem values      (1, 2, 3, 4, '2024-05-01 01:45:05', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-05-01', '2024-05-01', '2024-05-01', 'a', 'b', 'yyyyyyyyy'),    
     (1, 2, 3, 4, '2024-05-15 02:35:05', 5.5, 6.5, 0.15, 8.5, 'o', 'k', '2024-05-15', '2024-05-15', '2024-05-15', 'a', 'b', 'yyyyyyyyy'),     
     (2, 2, 3, 5, '2024-05-25 08:30:06', 5.5, 6.5, 0.2, 8.5, 'o', 'k', '2024-05-25', '2024-05-25', '2024-05-25', 'a', 'b', 'yyyyyyyyy'),     
     (3, 4, 3, 6, '2024-06-02 09:25:07', 5.5, 6.5, 0.3, 8.5, 'o', 'k', '2024-06-02', '2024-06-02', '2024-06-02', 'a', 'b', 'yyyyyyyyy'),     
     (4, 4, 3, 7, '2024-06-15 13:20:09', 5.5, 6.5, 0, 8.5, 'o', 'k', '2024-06-15', '2024-06-15', '2024-06-15', 'a', 'b', 'yyyyyyyyy'),     
     (5, 5, 6, 8, '2024-06-25 15:15:36', 5.5, 6.5, 0.12, 8.5, 'o', 'k', '2024-06-25', '2024-06-25', '2024-06-25', 'a', 'b', 'yyyyyyyyy'),     
     (5, 5, 6, 9, '2024-06-29 21:10:52', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-06-30', '2024-06-30', '2024-06-30', 'a', 'b', 'yyyyyyyyy'),     
     (5, 6, 5, 10, '2024-06-03 22:05:50', 7.5, 8.5, 0.1, 10.5, 'k', 'o', '2024-06-03', '2024-06-03', '2024-06-03', 'c', 'd', 'xxxxxxxxx');     
  
   CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL, 
    ps_suppkey INTEGER NOT NULL, 
    ps_availqty INTEGER NOT NULL, 
    ps_supplycost DECIMALV3(15, 2) NOT NULL, 
    ps_comment VARCHAR(199) NOT NULL
  ) DUPLICATE KEY(ps_partkey, ps_suppkey) DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3 PROPERTIES ("replication_num" = "1"); 
  
  
      insert into partsupp values     
      (2, 3, 9, 10.01, 'supply1'),     
      (4, 3, 9, 10.01, 'supply2'),     
      (5, 6, 9, 10.01, 'supply3'),     
      (6, 5, 10, 11.01, 'supply4');
```

In this example, the `o_ordertime` field of the `orders` table is the partition field, of type `DATETIME`, partitioned by day.

Queries are primarily conducted at a "day" granularity, which is relatively coarse:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  and l_suppkey = ps_suppkey 
WHERE 
  date_trunc(l_ordertime, 'day') <= DATE '2024-05-25' 
  AND date_trunc(l_ordertime, 'day') >= DATE '2024-05-05' 
GROUP BY 
  l_linestatus, 
  ps_partkey;
```

To prevent the materialized view from refreshing too many partitions at once, the partition granularity of the materialized view can be consistent with the base table `orders`, partitioned by "day".

The SQL definition of the materialized view can be at the "day" granularity and aggregate data by "day":

```sql
CREATE MATERIALIZED VIEW rollup_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
PROPERTIES ('replication_num' = '1') 
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') as order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  and l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```

## Checking the Status of Materialized Views

Materialized views typically exhibit two states:

- **Normal status**: Indicates whether the current materialized view can be used for transparent rewriting.

- **Unavailable status**: Refers to the abbreviated term for a materialized view that cannot be used for transparent rewriting. Nevertheless, the materialized view can still be queried directly.

### Viewing Materialized View Metadata

```sql
select * from mv_infos('database'='db_name')
where Name = 'mv_name' \G 
```

Return output:

```sql
*************************** 1. row ***************************
                Id: 139570
              Name: mv11
           JobName: inner_mtmv_139570
             State: NORMAL
SchemaChangeDetail: 
      RefreshState: SUCCESS
       RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON MANUAL
          QuerySql: SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE
           EnvInfo: EnvInfo{ctlId='0', dbId='16813'}
      MvProperties: {}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=lineitem, relatedCol='l_shipdate', partitionCol='l_shipdate'}
SyncWithBaseTables: 1
```

- **SyncWithBaseTables:** Indicates whether the data in the materialized view is consistent with that in the base table.
  
  - For fully constructed materialized views, this field is 1, indicating that the materialized view can be used for transparent rewriting.
  
  - For incrementally partitioned materialized views, availability is determined at the partition granularity. This means that even if some partitions of the materialized view are unavailable, as long as the queried partition is valid, the materialized view can still be used for transparent rewriting. Transparent rewriting depends primarily on whether the `SyncWithBaseTables` field of the queried partition is consistent. If `SyncWithBaseTables` is 1, the partition can be used for transparent rewriting; if it is 0, it cannot.

- **JobName:** The name of the job for constructing the materialized view. Each materialized view has one job, and each refresh creates a new task. The relationship between jobs and tasks is 1:n.

- **State:** If it changes to SCHEMA_CHANGE, it indicates that the schema of the base table has changed. At this point, the materialized view cannot be used for transparent rewriting (but direct querying of the materialized view is unaffected). If the next refresh task is successful, it will revert to NORMAL.

- **SchemaChangeDetail:** Indicates the reason for SCHEMA_CHANGE.

- **RefreshState:** The status of the last task refresh for the materialized view. If it is FAIL, it indicates a failure, and the cause of the failure can be further identified using the `tasks()` command. Refer to the section on [viewing materialized view task status](#viewing-materialized-view-task-status) for the `tasks()` command.

- **SyncWithBaseTables:** Indicates whether the data is synchronized with the base table. 1 indicates synchronized, and 0 indicates not synchronized. If not synchronized, you can use `show partitions` to further determine which partitions are not synchronized. Refer to the section below on viewing SyncWithBaseTables status for partitioned materialized views.

**Using Partitioned Materialized Views to viewSyncWithBaseTables Status**

Run `show partitions from mv_name` to check if the partitions used in the query are valid. Sample output:

```Plain
show partitions from mv11;
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

Primarily check if the `SyncWithBaseTables` field is true. False indicates that this partition cannot be used for transparent rewriting.

### Viewing Materialized View Task Status

Each materialized view has one job, and each refresh creates a new task. The relationship between jobs and tasks is 1:n.

To view the status and progress of refreshing tasks, run the following statement based on `JobName`:

```sql
select * from tasks("type"="mv")
where mvName = 'mv_name'
order by CreateTime desc \G
```

Return output:

```sql
*************************** 1. row ***************************
               TaskId: 167019363907545
                JobId: 139872
              JobName: inner_mtmv_139570
                 MvId: 139570
               MvName: mv11
         MvDatabaseId: 16813
       MvDatabaseName: regression_test_nereids_rules_p0_mv
               Status: SUCCESS
             ErrorMsg: 
           CreateTime: 2024-06-21 10:31:43
            StartTime: 2024-06-21 10:31:43
           FinishTime: 2024-06-21 10:31:45
           DurationMs: 2466
          TaskContext: {"triggerMode":"SYSTEM","isComplete":false}
          RefreshMode: COMPLETE
NeedRefreshPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
  CompletedPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
             Progress: 100.00% (15/15)
          LastQueryId: fe700ca3d6504521-bb522fc9ccf615e3
```

- NeedRefreshPartitions and CompletedPartitions record the partitions refreshed by this task.

- Status: If it is FAILED, it indicates a failure. The cause of the failure can be viewed through ErrorMsg, or you can search Doris logs using LastQueryId to obtain more detailed error information. Currently, task failures render existing materialized views unavailable, but this behavior will be changed so that even if a task fails, existing materialized views can still be used for transparent rewriting.

- ErrorMsg: The reason for the failure.

- RefreshMode: COMPLETE indicates that all partitions were refreshed, PARTIAL indicates that some partitions were refreshed, and NOT_REFRESH indicates that no partitions needed to be refreshed.

:::info Note
- If the `grace_period` property is set when creating the materialized view, it may still be used for transparent rewriting even if `SyncWithBaseTables` is false or 0 under certain circumstances.

- The `grace_period` is measured in seconds and indicates the time allowed for data inconsistency between the materialized view and the base tables it uses.
  
  - If set to 0, it means that the materialized view must be consistent with the base table data for it to be used for transparent rewriting.
  
  - If set to 10, it means that the materialized view and base table data are allowed to be delayed by up to 10 seconds. If there is a delay between the materialized view data and base table data, the materialized view can still be used for transparent rewriting within those 10 seconds.
:::

## Accelerating Queries by Materialized Views

To utilize materialized views for query acceleration, the first step is to analyze the profile file and identify the operation that consumes the most time in a query. Typically, this can be found in Join, Aggregate, Filter, or Calculated Expressions operations.

For Join, Aggregate, Filters, and Calculated Expressions, creating materialized views can significantly speed up query execution. If a query heavily relies on Join operations for computational resources while Aggregate operations consume relatively fewer resources, it may be beneficial to create a materialized view specifically for the Join operations.

Next, let's delve into how to construct materialized views for these four operations:

**1. For Join Operations**

Extract common join patterns used in queries to create materialized views. By using these materialized views during transparent rewriting, you can save computational resources required for Join operations. Remove filters from the query to create a more generalized Join materialized view.

**2. For Aggregate Operations**

It is recommended to use low-cardinality fields as dimensions when creating materialized views for aggregation. If the dimensions are correlated, the aggregated data size can be minimized.

For instance, consider a table t1 with 1 million rows. If a SQL query `groups by a, b, and c`, and the cardinalities of a, b, and c are 100, 50, and 15 respectively, the aggregated data size would be approximately 75,000 rows, indicating the effectiveness of a materialized view. If a, b, and c are correlated, the aggregated data size can be further reduced.

However, if the cardinalities of a, b, and c are high, resulting in a significantly larger aggregated dataset than the original table, creating a materialized view may not be beneficial due to low performance gains. For example, if the cardinality of c is 3500, the aggregated data size could reach around 17 million rows, much larger than the original table.

The granularity of aggregation in the materialized view should be finer than that of the query, meaning the materialized view should include all dimensions used in the query's GROUP BY clause. The materialized view should also include the same aggregate functions as the query.

**3. For Filter Operations**

If a query frequently filters on the same fields, adding corresponding filters to the materialized view can reduce its data size, thereby improving the performance when the materialized view is hit during a query.

It's important to note that the materialized view should have fewer filters than those appearing in the query, and the query's filters should encompass those in the materialized view. For instance, if the query is `a > 10 AND b > 5`, the materialized view can have no filters or filters that are more inclusive, such as `a > 5 AND b > 5` or simply `a > 5`.

**4. For Calculated Expressions**

Expressions like CASE WHEN or string manipulations can be computationally expensive. By pre-calculating these expressions in the materialized view, transparent rewriting can utilize the pre-computed data, thus improving query performance.

It's recommended to keep the number of columns in the materialized view to a minimum. If a query involves multiple fields, consider grouping them based on the original SQL pattern and creating separate materialized views for each group to avoid having too many columns in a single materialized view.

Example: Aggregation Query Acceleration

Query 1:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_partkey;
```

Query 2:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey;
```

Based on these two queries, we can create a more generic materialized view that includes aggregation. In this materialized view, we include both `l_partkey` and `l_suppkey` as GROUP BY dimensions and `o_orderdate` as a filter condition. Importantly, `o_orderdate` is not only used in the WHERE clause of the materialized view but is also included in its GROUP BY clause.

By creating this materialized view, both Query 1 and Query 2 can leverage it. The materialized view definition is as follows:

```sql
CREATE MATERIALIZED VIEW common_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES  ('replication_num' = '1')
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_shippriority,
  l_suppkey,
  l_partkey,
  o_orderdate;
```

## Use Cases

### Use Case 1: Accelerating Multi-Table Join and Aggregation Queries

Creating more generic materialized views can accelerate multi-table join and aggregation queries.

Take the following three SQL queries as examples:

Query 1:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount)
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01';
```

Query 2:

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

Query 3:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

To satisfy all the above queries, you can create a materialized view that removes the filtering conditions from Query 1 and Query 2, resulting in a more generic join and pre-computes the expression `l_extendedprice * (1 - l_discount)`. This saves computation time when queries hit the materialized view.

```sql
CREATE MATERIALIZED VIEW common_join_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES  ('replication_num' = '1')
AS 
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

If the above materialized view does not meet the performance requirements for accelerating Query 2, you can create an aggregate materialized view. To maintain generality, remove the filtering condition on the `o_orderdate` field.

```sql
CREATE MATERIALIZED VIEW target_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES  ('replication_num' = '1')
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

### Use Case 2: Accelerating Log analysis

For accelerating log analysis, it is recommended to not solely rely on asynchronous materialized views but to also consider synchronous materialized views.

The base table is typically partitioned by hour, and single-table aggregation queries often have time-based filters and a few identifier fields. When query response times cannot meet requirements, sync-materialized views can be created for acceleration.

For example, the base table definition is as follows:

```sql
CREATE TABLE IF NOT EXISTS test (
`app_name` VARCHAR(64) NULL COMMENT '标识', 
`event_id` VARCHAR(128) NULL COMMENT '标识', 
`decision` VARCHAR(32) NULL COMMENT '枚举值', 
`time` DATETIME NULL COMMENT '查询时间', 
`id` VARCHAR(35) NOT NULL COMMENT 'od', 
`code` VARCHAR(64) NULL COMMENT '标识', 
`event_type` VARCHAR(32) NULL COMMENT '事件类型' 
)
DUPLICATE KEY(app_name, event_id)
PARTITION BY RANGE(time)                                    
(                                                                                                                                      
    FROM ("2024-07-01 00:00:00") TO ("2024-07-15 00:00:00") INTERVAL 1 HOUR                                                                     
)     
DISTRIBUTED BY HASH(event_id)
BUCKETS 3 PROPERTIES ("replication_num" = "1");
```

The materialized view can aggregate data by minute, achieving a certain level of aggregation. For example:

```sql
CREATE MATERIALIZED VIEW sync_mv
    AS
    SELECT 
      decision,
      code, 
      app_name, 
      event_id, 
      event_type, 
      date_trunc(time, 'minute'), 
      DATE_FORMAT(
        `time`, '%Y-%m-%d'
      ), 
      cast(FLOOR(MINUTE(time) / 15) as decimal(9, 0)),
      count(id) as cnt
    from 
      test 
    group by 
      code, 
      app_name, 
      event_id, 
      event_type, 
      date_trunc(time, 'minute'), 
      decision, 
      DATE_FORMAT(time, '%Y-%m-%d'), 
      cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0));
```

A sample query:

```sql
SELECT 
    decision, 
    CONCAT(
        CONCAT(
          DATE_FORMAT(
            `time`, '%Y-%m-%d'
          ), 
          '', 
          LPAD(
            cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0)) * 15, 
            5, 
            '00'
          ), 
          ':00'
        )
      ) as time, 
      count(id) as cnt 
    from 
      test 
    where 
    date_trunc(time, 'minute') BETWEEN '2024-07-02 18:00:00' 
      AND '2024-07-03 20:00:00' 
    group by 
      decision, 
      DATE_FORMAT(
        `time`, "%Y-%m-%d"
      ), 
      cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0));
```

### Use Case 3: Federated Data Query in Data Lakehousing

Many users have a need for federated data queries based on Doris, and Doris's Multi-Catalog feature makes this convenient. Users can create a catalog and query external data through Doris without migrating the data to Doris.

However, this approach may cause issues as querying external data can be slow due to network latency and third-party service constraints, making it challenging to meet high response time requirements.

To address this, asynchronous materialized views based on external Catalogs can be created. Since materialized view data is stored within Doris, querying materialized views is faster. For scenarios requiring high response times, consider creating a materialized view based on an external Catalog.

::: tip
In the data lakehouse, before using transparent rewriting for external tables, you need to enable the `materialized_view_rewrite_enable_contain_external_table` switch. For details, refer to the [Async-Materialized View functions and demands](../async-materialized-view/functions-and-demands).
:::

### Use Case 4: Data Modeling (ETL)

Sometimes users process fact and dimension tables into a summary table for ad-hoc queries. This summary table can also serve as a base indicator table for subsequent modeling.

In such cases, materialized views can be used to model the base table data. Additionally, higher-level materialized views can be created based on existing materialized views (supported in 2.1.3), offering flexibility to meet diverse needs.

Each level of materialized views can have its own refresh method configured, such as:

- The first-level materialized view can be set to refresh periodically, while the second-level is set to refresh on trigger. This way, the refresh of the first-level materialized view automatically triggers the refresh of the second-level one.

- If both levels are set to refresh periodically, the second-level materialized view will not consider whether the first-level's data is synchronized with the base table when refreshing. Instead, it will process the first-level data and synchronize it to the second level.