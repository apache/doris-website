---
{
    "title": "Asynchronous materialized view",
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

# Asynchronous materialized view

## Construction and maintenance of materialized views

### Create materialized views

Prepare two tables and data
```sql
use tpch;

CREATE TABLE IF NOT EXISTS orders  (
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
    FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY)
    DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
    PROPERTIES ("replication_num" = "1");

insert into orders values
   (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),
   (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),
   (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');

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

insert into lineitem values
 (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
 (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
 (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```
Create materialized views
```sql
CREATE MATERIALIZED VIEW mv1 
        BUILD DEFERRED REFRESH AUTO ON MANUAL
        partition by(l_shipdate)
        DISTRIBUTED BY RANDOM BUCKETS 2
        PROPERTIES ('replication_num' = '1') 
        AS 
        select l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) as sum_total
            from lineitem
            left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
            group by
            l_shipdate,
            o_orderdate,
            l_partkey,
            l_suppkey;
```

Specific syntax can be viewed [CREATE ASYNC MATERIALIZED VIEW](../../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md)

### View materialized view meta information

```sql
select * from mv_infos("database"="tpch") where Name="mv1";
```

The unique features of materialized views can be viewed through [mv_infos()](../../sql-manual/sql-functions/table-functions/mv_infos.md)

Properties related to table, still viewed through [SHOW TABLES](../../sql-manual/sql-reference/Show-Statements/SHOW-TABLES.md)

### Refresh materialized view

The materialized view supports different refresh strategies, such as scheduled refresh and manual refresh. It also supports different refresh granularity, such as full refresh, incremental refresh of partition granularity, etc. Here we take manually refreshing partial partitions of the materialized view as an example.

First, check the list of materialized view partitions
```sql
SHOW PARTITIONS FROM mv1;
```

Refresh partition named `p_20231017_20231018`
```sql
REFRESH MATERIALIZED VIEW mv1 partitions(p_20231017_20231018);
```

Specific syntax can be viewed [REFRESH MATERIALIZED VIEW](../../sql-manual/sql-reference/Utility-Statements/REFRESH-MATERIALIZED-VIEW.md)

### task management

Each materialized view defaults to a job responsible for refreshing data, which is used to describe the refresh strategy and other information of the materialized view. Each time a refresh is triggered, a task is generated,
Task is used to describe specific refresh information, such as the time used for refreshing, which partitions were refreshed, etc

#### View jobs in materialized views

```sql
select * from jobs("type"="mv") order by CreateTime;
```

Specific syntax can be viewed [jobs("type"="mv")](../../sql-manual/sql-functions/table-functions/jobs.md)

#### Pause materialized view job scheduled scheduling

```sql
PAUSE MATERIALIZED VIEW JOB ON mv1;
```

Can pause the scheduled scheduling of materialized views

Specific syntax can be viewed [PAUSE MATERIALIZED VIEW JOB](../../sql-manual/sql-reference/Utility-Statements/PAUSE-MATERIALIZED-VIEW.md)

#### RESUME materialized view job scheduling

```sql
RESUME MATERIALIZED VIEW JOB ON mv1;
```

Can RESUME scheduled scheduling of materialized views

Specific syntax can be viewed [RESUME MATERIALIZED VIEW JOB](../../sql-manual/sql-reference/Utility-Statements/RESUME-MATERIALIZED-VIEW.md)

#### Viewing tasks in materialized views

```sql
select * from tasks("type"="mv");
```

Specific syntax can be viewed [tasks("type"="mv")](../../sql-manual/sql-functions/table-functions/tasks.md)

#### Cancel the task of objectifying the view

```sql
CANCEL MATERIALIZED VIEW TASK realTaskId on mv1;
```

Can cancel the operation of this task

Specific syntax can be viewed [CANCEL MATERIALIZED VIEW TASK](../../sql-manual/sql-reference/Utility-Statements/CANCEL-MATERIALIZED-VIEW-TASK.md)

### Modifying materialized views

Modify the properties of materialized views
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3333");
```

Modify the name of the materialized view, the refresh method of the materialized view, and the unique properties of the materialized view can be viewed through [ALTER ASYNC MATERIALIZED VIEW](../../sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-ASYNC-MATERIALIZED-VIEW.md)

The materialized view itself is also a Table, so Table related properties, such as the number of copies, are still modified through the syntax related to `ALTER TABLE`.

### Delete materialized view

```sql
DROP MATERIALIZED VIEW mv1;
```

The materialized view has a dedicated deletion syntax and cannot be deleted through the drop table,

Specific syntax can be viewed [DROP ASYNC MATERIALIZED VIEW](../../sql-manual/sql-reference/Data-Definition-Statements/Drop/DROP-ASYNC-MATERIALIZED-VIEW.md)

## Best Practice
### When there are excessive partitions in the base table, the materialized view should only focus on the data from the most recent period.
create table with 3 partitions
```sql
CREATE TABLE t1 (
    `k1` INT,
    `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
PARTITION p26 VALUES [("2024-03-26"),("2024-03-27")),
PARTITION p27 VALUES [("2024-03-27"),("2024-03-28")),
PARTITION p28 VALUES [("2024-03-28"),("2024-03-29"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2
PROPERTIES (
'replication_num' = '1'
);
```
To create a materialized view that focuses only on the data from the most recent day, assuming the current time is 2024-03-28 xx:xx:xx, the materialized view would include only the partition ranging from ["2024-03-28") to ("2024-03-29"). This ensures that the materialized view contains data only for the latest day.
```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`k2`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'replication_num' = '1',
'partition_sync_limit'='1',
'partition_sync_time_unit'='DAY'
)
AS
SELECT * FROM t1;
```
As another day passes and the current time becomes 2024-03-29 xx:xx:xx, a new partition is added to t1, ranging from ["2024-03-29") to ("2024-03-30"). If the materialized view is refreshed at this point, upon completion of the refresh, the materialized view will contain only this new partition, ranging from ["2024-03-29") to ("2024-03-30").

## The use of materialized views

can be viewed [Query async materialized view](./query-async-materialized-view.md)

## Notice

- Asynchronous materialized views are only supported for use in the [Nereids optimizer](../nereids.md)
- Currently, determining the synchronization between materialized views and base tables is only supported for `OlapTable`. For other types of external tables, they are directly considered to be synchronized. For instance, if the base tables of a materialized view are all external tables, they are assumed to be synchronized. When querying `mv_infos()`, the SyncWithBaseTables flag will always return 1 (true) for these external tables. When refreshing a materialized view, it is necessary to manually refresh specific partitions or specify `complete` to refresh all partitions.
