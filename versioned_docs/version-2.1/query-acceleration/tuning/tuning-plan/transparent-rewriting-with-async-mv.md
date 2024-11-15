---
{
    "title": "Transparent Rewriting by Async-Materialized View",
    "language": "zh-CN"
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

## Principle

The aync-materialized view adopts a transparent rewriting algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) model. This algorithm can analyze the structural information of query SQL, automatically find suitable materialized views, and attempt transparent rewriting to utilize the optimal materialized view to express the query SQL. By using precomputed materialized view results, it can significantly improve query performance and reduce computational costs.

## Tuning Case

Next, through an example, we will demonstrate in detail how to use aync-materialized views to optimize queries. This example covers a series of operations including the creation, metadata viewing, data refreshing, task management, modification, and deletion of materialized views.

### 1 Creation of Base Tables and Data Insertion

First, create two tables, `orders` and `lineitem`, in the tpch database, and insert the corresponding data.

```sql
CREATE DATABASE IF NOT EXISTS tpch;

USE tpch;  
  
-- Create the orders table  
CREATE TABLE IF NOT EXISTS orders (  
    o_orderkey       integer not null,  
    o_custkey        integer not null,  
    o_orderstatus    char(1) not null,  
    o_totalprice     decimalv3(15,2) not null,  
    o_orderdate      date not null,  
    o_orderpriority  char(15) not null,  
    o_clerk          char(15) not null,  
    o_shippriority   integer not null,  
    o_comment        varchar(79) not null  
)  
DUPLICATE KEY(o_orderkey, o_custkey)  
PARTITION BY RANGE(o_orderdate)(  
    FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY  
)  
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3  
PROPERTIES ("replication_num" = "1");  
  
-- Insert data into the orders table  
INSERT INTO orders VALUES  
    (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),  
    (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),  
    (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');  
  
-- Create the lineitem table  
CREATE TABLE IF NOT EXISTS lineitem (  
    l_orderkey    integer not null,  
    l_partkey     integer not null,  
    l_suppkey     integer not null,  
    l_linenumber  integer not null,  
    l_quantity    decimalv3(15,2) not null,  
    l_extendedprice  decimalv3(15,2) not null,  
    l_discount    decimalv3(15,2) not null,  
    l_tax         decimalv3(15,2) not null,  
    l_returnflag  char(1) not null,  
    l_linestatus  char(1) not null,  
    l_shipdate    date not null,  
    l_commitdate  date not null,  
    l_receiptdate date not null,  
    l_shipinstruct char(25) not null,  
    l_shipmode     char(10) not null,  
    l_comment      varchar(44) not null  
)  
DUPLICATE KEY(l_orderkey, l_partkey, l_suppkey, l_linenumber)  
PARTITION BY RANGE(l_shipdate)  
(FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY)  
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3  
PROPERTIES ("replication_num" = "1");  
  
-- Insert data into the lineitem table  
INSERT INTO lineitem VALUES  
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),  
    (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),  
    (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```

### 2 Creation of Async-Materialized View

Next, create an asynchronous materialized view `mv1`.

```sql
CREATE MATERIALIZED VIEW mv1   
BUILD DEFERRED REFRESH AUTO ON MANUAL  
PARTITION BY(l_shipdate)  
DISTRIBUTED BY RANDOM BUCKETS 2  
PROPERTIES ('replication_num' = '1')   
AS   
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, SUM(o_totalprice) AS sum_total  
FROM lineitem  
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate  
GROUP BY  
l_shipdate,  
o_orderdate,  
l_partkey,  
l_suppkey;
```

### 3 Viewing Materialized View Metadata

```sql
SELECT * FROM mv_infos("database"="tpch") WHERE Name="mv1";
```

### 4 Refreshing the Materialized View

First, view the partition list:

```sql
SHOW PARTITIONS FROM mv1;
```

Then refresh a specific partition:

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS(p_20231017_20231018);
```

### 5 Task Management

Manage jobs for materialized views, including viewing jobs, pausing scheduled tasks, resuming scheduled tasks, and viewing and canceling tasks.

- View materialized view jobs
  
    ```sql
    SELECT * FROM jobs("type"="mv") ORDER BY CreateTime;
    ```

- Pause scheduled tasks for materialized views
  
    ```sql
    PAUSE MATERIALIZED VIEW JOB ON mv1;
    ```
- Resume scheduled tasks for materialized views
  
    ```sql
    RESUME MATERIALIZED VIEW JOB ON mv1;
    ```

- View materialized view tasks
  
    ```sql
    SELECT * FROM tasks("type"="mv");
    ```

- Cancel a materialized view task: assuming `realTaskId` is 123

    ```sql
    CANCEL MATERIALIZED VIEW TASK 123 ON mv1;
    ```

### 6 Modifying the Materialized View

```sql
ALTER MATERIALIZED VIEW mv1 SET("grace_period"="3333");
```

### 7 Deleting the Materialized View

```sql
DROP MATERIALIZED VIEW mv1;
```

### 8 Querying Using the Materialized View

- Direct query

    ```sql
    SELECT l_shipdate, sum_total 
    FROM mv1 
    WHERE l_partkey = 2 AND l_suppkey = 3;
    ```

- Query through transparent rewriting (the query optimizer automatically uses the materialized view)

    ```sql
    SELECT l_shipdate, SUM(o_totalprice) AS total_price
    FROM lineitem
    LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
    WHERE l_partkey = 2 AND l_suppkey = 3
    GROUP BY l_shipdate;
    ```

The above example fully demonstrates the lifecycle of an asynchronous materialized view, including creation, management, usage, and deletion.

## Summary

By utilizing materialized views, query performance can be significantly enhanced, particularly for complex aggregated queries. Several considerations should be kept in mind when using them:

1. Precomputed Results: Materialized views precompute and store query results, avoiding the overhead of repeated computations for each query. This is especially effective for complex queries that need to be executed frequently.

2. Reduction of Join Operations: Materialized views can consolidate data from multiple tables into a single view, reducing the need for join operations during queries and thereby improving query efficiency.

3. Automatic Updates: When the data in the base tables changes, materialized views can be automatically updated to maintain data consistency. This ensures that query results always reflect the latest data state.

4. Storage Overhead: Materialized views require additional storage space to save precomputed results. When creating materialized views, a trade-off between query performance improvement and storage space consumption needs to be considered.

5. Maintenance Cost: The maintenance of materialized views requires certain system resources and time. Frequently updated base tables may result in higher update overhead for materialized views. Therefore, it is necessary to select an appropriate refresh strategy based on actual conditions.

6. Use Cases: Materialized views are suitable for scenarios where data changes infrequently but query frequency is high. For data that changes frequently, real-time computation may be more appropriate.

The rational use of materialized views can significantly improve database query performance, especially in the case of complex queries and large data volumes. At the same time, it is also necessary to comprehensively consider factors such as storage and maintenance to achieve a balance between performance and cost.