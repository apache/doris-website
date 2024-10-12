---
{
    "title": "使用与实践",
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

## 异步物化视图使用原则

1. **时效性考虑：**异步物化视图通常用于对数据时效性要求不高的场景，一般是 T+1 的数据。如果时效性要求高，应考虑使用同步物化视图。

2. **加速效果与一致性考虑：**在查询加速场景，创建物化视图时，DBA 应将常见查询 SQL 模式分组，尽量使组之间无重合。SQL 模式组划分越清晰，物化视图构建的质量越高。一个查询可能使用多个物化视图，同时一个物化视图也可能被多个查询使用。构建物化视图需要综合考虑命中物化视图的响应时间（加速效果）、构建成本、数据一致性要求等。

3. **物化视图定义与构建成本考虑：**
    
    - 物化视图定义和原查询越接近，查询加速效果越好，但物化的通用性和复用性越差，意味着构建成本越高。
    
    - 物化视图定义越通用（例如没有 WHERE 条件和更多聚合维度），查询加速效果较低，但物化的通用性和复用性越好，意味着构建成本越低。

需要注意：

1. **物化视图数量控制：**物化视图并非越多越好。物化视图参与透明改写，且 CBO 代价模型选择需要时间。理论上，物化视图越多，透明改写的时间越长，且物化视图构建和刷新占用的资源越大。

2. **定期检查物化视图使用状态：**如果未使用，应及时删除。

3. **基表数据更新频率：**如果物化视图的基表数据频繁更新，可能不太适合使用物化视图，因为这会导致物化视图频繁失效，不能用于透明改写（可直查）。如果需要使用此类物化视图进行透明改写，需要允许查询的数据有一定的时效延迟，并可以设定`grace_period`。具体见`grace_period`的适用介绍。

## 物化视图刷新方式选择原则

当满足以下条件时，建议创建分区物化视图：

- 物化视图的基表数据量很大，并且基表是分区表。

- 物化视图使用的表除了分区表外，其他表不经常变化。

- 物化视图的定义 SQL 和分区字段满足分区推导的要求，即符合分区增量更新的要求。详细要求可参考：[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW/#refreshmethod)

- 物化视图分区数不多。

当物化视图的部分分区失效时，透明改写可以使用物化视图的有效分区 UNION ALL 基表返回数据。如果不能构建分区物化视图，可以考虑选择全量刷新的物化视图。

## 分区物化视图常见使用方式

当物化视图的基表数据量很大，且基表是分区表时，如果物化视图的定义 SQL 和分区字段满足分区推导的要求，此种场景比较适合构建分区物化视图。分区推导的详细要求可参考 [CREATE-ASYNC-MATERIALIZED-VIEW ](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW/#refreshmethod)和[异步物化视图 FAQ 构建问题 12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12构建分区物化视图报错)。

物化视图的分区是跟随基表的分区映射创建的，一般和基表的分区是 1:1 或者 1:n 的关系。

- 如果基表的分区发生数据变更，如新增分区、删除分区等情况，物化视图对应的分区也会失效。失效的分区不能用于透明改写，但可以直查。透明改写时发现物化视图的分区数据失效，失效的分区会通过联合基表来响应查询。

    确认物化视图分区状态的命令详见查看物化视图状态，主要是`show partitions from mv_name`命令。

- 如果物化视图引用的非分区表发生数据变更，会触发物化视图所有分区失效，导致此物化视图不能用于透明改写。需要刷新物化视图所有分区的数据，命令为`REFRESH MATERIALIZED VIEW mv1 AUTO;`。此命令会尝试刷新物化视图，如果满足分区增量构建的条件则进行分区增量构建，否则退化为全量构建。

    因此，一般将数据频繁变化的表放在分区物化视图引用的分区表，将不经常变化的维表放在非引用分区表的位置。


分区物化视图的透明改写是分区粒度的，即使物化视图的部分分区失效，此物化视图仍然可用于透明改写。但如果只查询了一个分区，并且物化视图这个分区数据失效了，那么此物化视图不能用于透明改写。

举例 1：

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

在这个例子中，`orders`表的`o_ordertime`字段是分区字段，类型是`DATETIME`，按照天分区。

查询主要是按照“天”的粒度，查询粒度比较粗：

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

为了不让物化视图每次刷新的分区数量过多，物化视图的分区粒度可以和基表`orders`一致，按“天”分区。

物化视图的定义 SQL 的粒度可以按照“天”，并且按照“天”来聚合数据，

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

## 查看物化视图状态

通常物化视图会出现两种状态：

- **状态正常：**指的是当前物化视图是否可用于透明改写。

- **不可用、状态不正常：**指的是物化视图不能用于透明改写的简称。尽管如此，该物化视图还是可以直查的。

### 查看物化视图元数据

```sql
select * from mv_infos('database'='db_name')
where Name = 'mv_name' \G 
```

返回结果如下：

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

- **SyncWithBaseTables：** 表示物化视图和基表的数据是否一致。
  
  - 对于全量构建的物化视图，此字段为 1，表明此物化视图可用于透明改写。
  
  - 对于分区增量的物化视图，分区物化视图是否可用，是以分区粒度去看的。也就是说，即使物化视图的部分分区不可用，但只要查询的是有效分区，那么此物化视图依旧可用于透明改写。是否能透明改写，主要看查询所用分区的 `SyncWithBaseTables` 字段是否一致。如果 `SyncWithBaseTables` 是 1，此分区可用于透明改写；如果是 0，则不能用于透明改写。

- **JobName：**物化视图构建 Job 的名称，每个物化视图有一个 Job，每次刷新会有一个新的 Task，Job 和 Task 是 1:n 的关系

- **State：**如果变为 SCHEMA_CHANGE，代表基表的 Schema 发生了变化，此时物化视图将不能用来透明改写 (但是不影响直接查询物化视图)，下次刷新任务如果执行成功，将恢复为 NORMAL。

- **SchemaChangeDetail：** 表示 SCHEMA_CHANGE 发生的原因。

- **RefreshState：** 物化视图最后一次任务刷新的状态。如果为 FAIL，代表执行失败，可以通过 `tasks() `命令进一步定位失败原因。Task 命令见本文[查看物化视图 Task 状态](#查看物化视图-task-状态)。

- **SyncWithBaseTables：** 是否和基表数据同步。1 为同步，0 为不同步。如果不同步，可通过 `show partitions` 进一步判断哪个分区不同步。`show partitions` 见下文分区物化视图查看 SyncWithBaseTables 状态方法。

**分区物化视图查看 SyncWithBaseTables 状态方法**

运行 `show partitions from mv_name`查看查询使用的分区是否有效，返回结果如下：

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

主要查看 `SyncWithBaseTables` 字段是否为 true。false 表示此分区不可用于透明改写。

### 查看物化视图 Task 状态

每个物化视图有一个 Job，每次刷新会有一个新的 Task，Job 和 Task 是 1:n 的关系。

根据 `JobName` 查看物化视图的 Task 状态，运行如下语句，可以查看刷新任务的状态和进度：

```sql
select * from tasks("type"="mv")
where mvName = 'mv_name'
order by CreateTime desc \G
```

返回结果如下：

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

- NeedRefreshPartitions，CompletedPartitions 记录的是此次 Task 刷新的分区。

- Status：如果为 FAILED，代表运行失败，可通过 ErrorMsg 查看失败原因，也可通过 LastQueryId 来搜索 Doris 的日志，获取更详细的错误信息。目前任务失败会导致已有物化视图不可用，后面会改成尽管任务失败，但是已存在的物化视图可用于透明改写。

- ErrorMsg：失败原因。

- RefreshMode：complete 代表刷新了全部分区，PARTIAL 代表刷新了部分分区，NOT_REFRESH 代表不需要刷新任何分区。

:::info 备注
- 如果物化视图创建的时候设置了 `grace_period` 属性，那么即使 `SyncWithBaseTables` 是 false 或者 0，有些情况下它依然可用于透明改写。

- `grace_period` 的单位是秒，指的是容许物化视图和所用基表数据不一致的时间。

  - 如果设置成 0，意味着要求物化视图和基表数据保持一致，此物化视图才可用于透明改写。

  - 如果设置成 10，意味着物化视图和基表数据允许 10 秒的延迟，如果物化视图的数据和基表的数据有延迟，在 10 秒内，此物化视图都可以用于透明改写。
:::

## 如何使用物化视图加速查询

使用物化视图查询加速，首先需要查看 profile 文件，找到一个查询消耗时间最多的操作，一般出现在连接（Join）、聚合（Aggregate）、过滤（Filter）或者表达式计算（Calculated Expressions）。

对于 Join、Aggregate、Filters、Calculated Expressions，构建物化视图都能起到加速查询的作用。如果一个查询中 Join 占用了大量的计算资源，而 Aggregate 相对而言占用较小的资源，则可以针对 Join 构建物化视图。

接下来，将详细说明如何针对上述四种操作构建物化视图：

**1. 对于 Join**

可以提取查询中使用的公共的表连接模式来构建物化视图。透明改写如果使用了此物化视图，可以节省 Join 连接的计算。将查询中的 Filters 去除，这样就是一个比较通用的 Join 物化视图。

**2. 对于 Aggregate**

建议尽量使用低基数的字段作为维度来构建物化视图。如果维度相关，那么聚合后的数量可以尽量减少。

比如表 t1，原表的数据量是 1000000，查询语句 SQL 中有 `group by a, b, c`。如果 a，b，c 的基数分别是 100，50，15，那么聚合后的数据大概在 75000 左右，说明此物化视图是有效的。如果 a，b，c 具有相关性，那么聚合后的数据量会进一步减少。

如果 a, b, c 的基数很高，会导致聚合后的数据急速膨胀。如果聚合后的数据比原表的数据还多，可能这样的场景不太适合构建物化视图。比如 c 的基数是 3500，那么聚合后的数据量在 17000000 左右，比原表数据量大的多，构建这样的物化视图性能加速收益低。

物化视图的聚合粒度要比查询细，即物化视图的聚合维度包含查询的聚合维度，这样才能提供查询所需的数据。查询可以不写 Group By，同理，物化视图的聚合函数应该包含查询的聚合函数。

**3. 对于 Filter**

如果查询中经常出现对相同字段的过滤，那么通过在物化视图中添加相应的 Filter，可以减少物化视图中的数据量，从而提高查询时命中物化视图的性能。

要注意的是，物化视图应该比查询中出现的 Filter 少，查询的 Filter 要包含物化的 Filter。比如查询是 `a > 10 and b > 5`，物化视图可以没有 Filter，如果有 Filter 的话应对 a 和 b 过滤，并且数据范围要求比查询大，例如物化视图可以是 `a > 5 and b > 5，b > 0`，也可以是 a > 5 等。

**4. 对于 Calculated Expressions**

以 case when、处理字符串等函数为例，这部分表达式计算非常消耗性能，如果在物化视图中能够提前计算好，透明改写使用计算好的物化视图则可以提高查询的性能。

建议物化视图的列数量尽量不要过多。如果查询使用了多个字段，应该根据最开始的查询 SQL 模式分组，分别构建对应列的物化视图，避免单个物化视图的列过多。

以聚合查询加速为例：

查询 1：

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

查询 2：

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

根据以上两个 SQL 查询，我们可以构建一个更为通用的包含 Aggregate 的物化视图。在这个物化视图中，我们将 l_partkey 和 l_suppkey 都作为聚合的 group by 维度，并将 o_orderdate 作为过滤条件。值得注意的是，o_orderdate 不仅在物化视图的条件补偿中使用，同时也需要被包含在物化视图的聚合 group by 维 度中。

通过这种方式构建的物化视图后，查询 1 和查询 2 都可以命中该物化视图，物化视图定义如下：

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

## 使用场景

### 场景一：多表连接聚合查询加速

通过构建更通用的物化视图能够加速多表连接聚合查询。

以下面三个查询 SQL 为例：

查询 1：

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

查询 2：

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

查询 3：

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

对于如上查询，可以构建如下物化视图来满足上述所有查询。

物化视图的定义中去除了查询 1 和查询 2 的过滤条件，得到了一个更通用的 Join，并提前计算了表达式`l_extendedprice * (1 - l_discount)`，这样当查询命中物化视图时，可以节省表达式的计算。

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

如果上述物化视图不能满足查询 2 的加速性能要求，可以构建聚合物化视图。为了保持通用性，可以去除对`o_orderdate`字段的过滤条件。

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

### 场景二：日志查询加速

在日志查询加速场景中，建议不局限于单独使用异步物化视图，可以结合同步物化视图。

一般基表是分区表，按照小时分区居多，单表聚合查询，一般过滤条件是按照时间，还有一些标识位。有时查询的响应速度无法达到要求，一般可以构建同步物化视图进行加速。

例如，基表的定义可能如下：

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

物化视图可以按照分钟聚合数据，这样也能达到一定的聚合效果。例如：

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

查询语句可能如下：

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

### 场景三：湖仓一体联邦数据查询

很多用户有基于 Doris 进行联邦数据查询的需求，Doris 的多源数据目录（Multi-Catalog）功能使得这一需求变得十分便捷。用户只需创建一个 Catalog，无需将数据迁移到 Doris，即可通过 Doris 对外部数据进行查询。

然而，这种方式也可能带来一些问题。因为查询外部数据的速度可能会受到网络及第三方服务的影响，导致响应速度较慢，对于响应速度要求比较高的场景，可能难以满足需求。

为了解决这个问题，可以基于外部 Catalog 创建异步物化视图。由于物化视图本身的数据是存储在 Doris 内部的，所以查询物化视图的速度会很快。因此，对于响应速度要求比较高的场景，我们可以考虑基于外部 Catalog 创建一个物化视图。

:::tip 提示
在湖仓一体场景下，使用外表透明改写之前需要打开 `materialized_view_rewrite_enable_contain_external_table` 开关，详情可参考[异步物化视图功能描述](../async-materialized-view/functions-and-demands)。
:::

### 场景四：数据建模（ETL）

有时用户会使用事实表和维度表加工成一张汇总表，之后对此汇总表进行 Ad-hoc 查询。此汇总表也可作为基础指标表，用于后续的建模。

此时，可以利用物化视图对基表的数据进行建模。之后，还可以利用创建好的物化视图创建更高层级的物化视图（2.1.3 支持），灵活满足不同的需求。

不同层级的物化视图都可以自己设置刷新方式，例如：

- 第一层的物化视图可以设置为定时刷新，第二层的设置为触发刷新。这样，第一层的物化视图刷新完成后，会自动触发第二层物化视图的刷新。

- 如果每层的物化视图都设置为定时刷新，那么第二层物化视图刷新的时候，不会考虑第一层的物化视图数据是否和基表同步，只会把第一层物化视图的数据加工后同步到第二层。