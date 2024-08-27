---
{
    "title": "异步物化视图",
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

# 异步物化视图

## 物化视图的构建和维护

### 创建物化视图

准备两张表和数据
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
创建物化视图
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

具体的语法可查看 [CREATE-ASYNC-MATERIALIZED-VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-ASYNC-MATERIALIZED-VIEW.md).

### 查看物化视图元信息

```sql
select * from mv_infos("database"="tpch") where Name="mv1";
```

物化视图独有的特性可以通过 [mv_infos()](../../sql-manual/sql-functions/table-functions/mv_infos) 查看。

和 Table 相关的属性，仍通过 [SHOW TABLES](../../sql-manual/sql-statements/Show-Statements/SHOW-TABLES) 查看。

### 刷新物化视图

物化视图支持不同刷新策略，如定时刷新和手动刷新。也支持不同的刷新粒度，如全量刷新，分区粒度的增量刷新等。这里我们以手动刷新物化视图的部分分区为例。

首先查看物化视图分区列表
```sql
SHOW PARTITIONS FROM mv1;
```

刷新名字为`p_20231017_20231018`的分区
```sql
REFRESH MATERIALIZED VIEW mv1 partitions(p_20231017_20231018);
```

具体的语法可查看[REFRESH MATERIALIZED VIEW](../../sql-manual/sql-statements/Utility-Statements/REFRESH-MATERIALIZED-VIEW)

### 任务管理

每个物化视图都会默认有一个 Job 负责刷新数据，Job 用来描述物化视图的刷新策略等信息，每次触发刷新，都会产生一个 Task，
Task 用来描述具体的一次刷新信息，例如刷新用的时间，刷新了哪些分区等

#### 查看物化视图的 Job

```sql
select * from jobs("type"="mv") order by CreateTime;
```

具体的语法可查看[jobs("type"="mv")](../../sql-manual/sql-functions/table-functions/jobs)

#### 暂停物化视图 job 定时调度

```sql
PAUSE MATERIALIZED VIEW JOB ON mv1;
```

可以暂停物化视图的定时调度

具体的语法可查看[PAUSE MATERIALIZED VIEW Job](../../sql-manual/sql-statements/Utility-Statements/PAUSE-MATERIALIZED-VIEW.md)

#### 恢复物化视图 Job 定时调度

```sql
RESUME MATERIALIZED VIEW JOB ON mv1;
```

可以恢复物化视图的定时调度

具体的语法可查看[RESUME MATERIALIZED VIEW JOB](../../sql-manual/sql-statements/Utility-Statements/RESUME-MATERIALIZED-VIEW.md)

#### 查看物化视图的 Task

```sql
select * from tasks("type"="mv");
```

具体的语法可查看[tasks("type"="mv")](../../sql-manual/sql-functions/table-functions/tasks.md)

#### 取消物化视图的 Task

```sql
CANCEL MATERIALIZED VIEW TASK realTaskId on mv1;
```

可以取消本次 Task 的运行

具体的语法可查看[CANCEL MATERIALIZED VIEW TASK](../../sql-manual/sql-statements/Utility-Statements/CANCEL-MATERIALIZED-VIEW-TASK.md)

### 修改物化视图

修改物化视图的属性
```sql
ALTER MATERIALIZED VIEW mv1 set("grace_period"="3333");
```

修改物化视图的名字，物化视图的刷新方式及物化视图特有的 Property 可通过[ALTER ASYNC MATERIALIZED VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-ASYNC-MATERIALIZED-VIEW.md)来修改

物化视图本身也是一个 Table，所以 Table 相关的属性，例如副本数，仍通过`ALTER TABLE`相关的语法来修改。

### 删除物化视图

```sql
DROP MATERIALIZED VIEW mv1;
```

物化视图有专门的删除语法，不能通过 Drop Table 来删除，

具体的语法可查看[DROP ASYNC MATERIALIZED VIEW](../../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-ASYNC-MATERIALIZED-VIEW.md)

## 分区说明
物化视图的分区有两种方式：

1. 自定义分区

2. 依赖基表的分区自动创建分区

### 自定义分区
创建物化视图的时候不指定分区信息，物化视图就会默认创建一个分区，所有数据都存放在这个分区中。

### 依赖基表进行分区
物化视图可以通过多个基表 Join 关联创建。

物化视图能选择追随其中一个基表进行分区（建议选择事实表）。

例如

t1 的建表语句如下：

```sql
CREATE TABLE `t1` (
  `user_id` LARGEINT NOT NULL,
  `o_date` DATE NOT NULL,
  `num` SMALLINT NOT NULL
) ENGINE=OLAP
COMMENT 'OLAP'
PARTITION BY RANGE(`o_date`)
(
PARTITION p20170101 VALUES [('2017-01-01'), ('2017-01-02')),
PARTITION p20170102 VALUES [('2017-01-02'), ('2017-01-03')),
PARTITION p20170201 VALUES [('2017-02-01'), ('2017-02-02'))
)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 2
PROPERTIES ('replication_num' = '1') ;
```

t2 的建表语句如下：

```sql
CREATE TABLE `t2` (
  `user_id` LARGEINT NOT NULL,
  `age` SMALLINT NOT NULL
) ENGINE=OLAP
PARTITION BY LIST(`age`)
(
    PARTITION `p1` VALUES IN ('1'),
    PARTITION `p2` VALUES IN ('2')
)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 2
PROPERTIES ('replication_num' = '1') ;
```

如果物化视图的建表语句如下，那么物化视图 mv1 将和 t1 一样，有三个分区：
- [('2017-01-01'), ('2017-01-02'))
- [('2017-01-02'), ('2017-01-03'))
- [('2017-02-01'), ('2017-02-02'))

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`order_date`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'replication_num' = '1'
)
AS
SELECT t1.o_date as order_date, t1.user_id as user_id, t1.num, t2.age FROM t1 join t2 on t1.user_id=t2.user_id;
```

如果如果物化视图的建表语句如下，那么物化视图 mv2 将和 t2 一样，有两个分区：
- ('1')
- ('2')

```sql
CREATE MATERIALIZED VIEW mv2
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`age`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'replication_num' = '1'
)
AS
SELECT t1.o_date as order_date, t1.user_id as user_id, t1.num, t2.age FROM t1 join t2 on t1.user_id=t2.user_id;
```
#### 基表有多列分区
目前仅支持 Hive 外表有多列分区。

Hive 外表有很多多级分区的情况，例如一级分区按照日期，二级分区按照区域。

物化视图可以选择 Hive 的某一级分区列作为物化视图的分区列。

例如 hive 的建表语句如下：
```sql
CREATE TABLE hive1 (
`k1` int)
PARTITIONED BY (
`year` int,
`region` string)
STORED AS ORC;

alter table hive1 add if not exists
partition(year=2020,region="bj")
partition(year=2020,region="sh")
partition(year=2021,region="bj")
partition(year=2021,region="sh")
partition(year=2022,region="bj")
partition(year=2022,region="sh")
```
如果物化视图的创建语句如下，那么物化视图 `mv_hive` 将有如下三个分区：
- ('2020')
- ('2021')
- ('2022')
```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT k1,year,region FROM hive1;
```

如果物化视图的建表语句如下，那么物化视图 `mv_hive2` 将有如下两个分区：
- ('bj')
- ('sh')
```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT k1,year,region FROM hive1;
```

#### 仅使用基表部分分区
注意：2.1.1 开始支持

有些基表有很多分区，但是物化视图只关注最近一段时间的“热”数据，那么可以使用此功能。

如果基表的建表语句如下
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
如果物化视图的创建语句如下，代表物化视图只关注最近一天的数据，如果当前时间为 2024-03-28 xx:xx:xx，这样物化视图会仅有一个分区 [("2024-03-28"),("2024-03-29"))
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
如果时间又过了一天，当前时间为 2024-03-29 xx:xx:xx，t1 新增一个分区 [("2024-03-29"),("2024-03-30"))，如果此时刷新物化视图，刷新完成后，物化视图会仅有一个分区 [("2024-03-29"),("2024-03-30"))

如果分区字段是字符串类型，可以设置物化视图属性'partition_date_format',例如'%Y-%m-%d'

#### 分区上卷

基表的数据经过聚合后，每个分区的数据可能变的很少，这种情况下，可以使用分区上卷，减少物化视图的分区数量。

##### List 分区
注：Hive 分区对应 Apache Doris 的 List 分区。

如果基表建表语句如下
```sql
CREATE TABLE `t1` (
  `k1` INT NOT NULL,
  `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY list(`k2`)
(
PARTITION p_20200101 VALUES IN ("2020-01-01"),
PARTITION p_20200102 VALUES IN ("2020-01-02"),
PARTITION p_20200201 VALUES IN ("2020-02-01")
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2
PROPERTIES ('replication_num' = '1') ;
```
如果物化视图创建语句如下，那么物化视图有两个分区：
- ("2020-01-01","2020-01-02")
- ("2020-02-01")
```sql
CREATE MATERIALIZED VIEW mv1
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'month'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    'replication_num' = '1'
    )
    AS
    SELECT * FROM t1;
```
如果如果物化视图创建语句如下，那么物化视图有一个分区：
- ("2020-01-01","2020-01-02","2020-02-01")
```sql
CREATE MATERIALIZED VIEW mv1
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'year'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    'replication_num' = '1'
    )
    AS
    SELECT * FROM t1;
```
##### range 分区
如果基表建表语句如下
```sql
CREATE TABLE `t1` (
  `k1` LARGEINT NOT NULL,
  `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
PARTITION p_20200101 VALUES [("2020-01-01"),("2020-01-02")),
PARTITION p_20200102 VALUES [("2020-01-02"),("2020-01-03")),
PARTITION p_20200201 VALUES [("2020-02-01"),("2020-02-02"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2
PROPERTIES ('replication_num' = '1') ;
```
如果物化视图创建语句如下，那么物化视图有两个分区：
- [("2020-01-01","2020-02-01"))
- [("2020-02-01","2020-03-01"))
```sql
CREATE MATERIALIZED VIEW mv1
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'month'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    'replication_num' = '1'
    )
    AS
    SELECT * FROM t1;
```
如果物化视图创建语句如下，那么物化视图有一个分区：
- [("2020-01-01","2021-01-01"))
```sql
CREATE MATERIALIZED VIEW mv1
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'year'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    PROPERTIES (
    'replication_num' = '1'
    )
    AS
    SELECT * FROM t1;
```
注意：分区是字符串时，上卷的方式还在设计中。现在的行为有可能变动，最好不要使用。

## 数据刷新
### 刷新原理
物化视图是按照分区为单位进行刷新的，如果物化视图没有指定分区，那么每次都刷新物化视图的默认分区，相当于刷新物化视图的全部数据。
### 触发机制
物化视图有三种触发刷新机制
#### 手动触发
用户通过 SQL 语句触发物化视图的刷新，目前有三种策略：
1. 不关心具体刷新哪些分区，要求刷新完成后，物化视图的数据和基表保持同步。
```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```
2. 不管物化视图现存哪些数据，刷新物化视图的所有分区
```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```
3. 不管物化视图现存哪些数据，只刷新指定的分区
```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1,partitionName2);
```
`partitionName` 可以通过 `show partitions from mvName` 获取。
#### 定时触发
通过物化视图的创建语句指定间隔多久刷新一次数据
1. 如果物化视图的创建语句如下，要求全量刷新（refresh complete），那么物化视图每 10 小时刷新一次，并且刷新物化视图的所有分区。
```sql
CREATE MATERIALIZED VIEW mv1
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
partition by(`xxx`)
AS
select ...;
```
2. 如果物化视图的创建语句如下，要求全量刷新（refresh auto），那么物化视图每 10 小时刷新一次，并且自动计算需要刷新的分区（2.1.3 开始能自动计算 Hive 需要刷新的分区）。
```sql
CREATE MATERIALIZED VIEW mv1
REFRESH AUTO ON SCHEDULE EVERY 10 hour
partition by(`xxx`)
AS
select ...;
```
#### 自动触发
注意：2.1.4 开始支持

基表数据发生变更后，自动触发相关物化视图刷新，刷新的分区范围同**定时触发**。

如果物化视图的创建语句如下，那么当 t1 的数据发生变化，会自动触发物化视图的刷新。
```sql
CREATE MATERIALIZED VIEW mv1
REFRESH ON COMMIT
partition by(`xxx`)
AS
select ... from t1;
```

## 问题定位
### 定位手段
`olapTable` 的常用命令都适用于物化视图，例如`show partitions`，`desc table`，`show data`等。

物化视图独有的命令主要有以下几个：
#### 查看物化视图元信息
[mv_infos()](../../sql-manual/sql-functions/table-functions/mv_infos)

重点关注以下字段：
- State：如果变为 `SCHEMA_CHANGE`，代表基表的 Schema 发生了变化，此时物化视图将不能用来透明改写 (但是不影响直接查询物化视图)，下次刷新任务如果执行成功，将恢复为 `NORMAL`。
- SchemaChangeDetail：`SCHEMA_CHANGE` 发生的原因
- RefreshState: 物化视图最后一次任务刷新的状态，如果为`FAIL`，代表执行失败，可以通过 `tasks()` 进一步定位
- SyncWithBaseTables: 是否和基表数据同步，如果不同步，可通过 `show partitions` 进一步判断哪个分区不同步
#### 查看物化视图的 Task
[tasks("type"="mv")](../../sql-manual/sql-functions/table-functions/tasks.md)

重点关注以下字段：
- Status：如果为 `FAILED`，代表运行失败，可通过 `ErrorMsg` 查看失败原因，也可通过 `LastQueryId` 来搜索 Apache Doris 的日志，获取更详细的错误信息
- ErrorMsg：失败原因
- DurationMs：Task 运行耗时
- TaskContext：Task 上下文，可看到 Task 的触发信息
- RefreshMode：`COMPLETE` 代表刷新了全部分区，`PARTIAL` 代表刷新了部分分区，`NOT_REFRESH` 代表不需要刷新任何分区

### 常见问题
1. 物化视图是如何判断需要刷新哪些分区的？

   doris 内部会计算物化视图和基表的分区对应关系，并且记录上次刷新成功之后物化视图使用的基表分区版本，例如物化视图 mv1 由基表 t1 和 t2 创建，并且依赖 t1 进行分区

   假设 mv1 的分区 p202003 对应基表 t1 的分区 p20200301 和 p20200302，那么刷新 p202003 之后，会记录分区 p20200301，p20200302，以及表 t2 的当前版本

   下次刷新时，会判断 p20200301，p20200302 以及 t2 的版本是否发生变化，如果其中之一发生了变化，代表 p202003 需要刷新

   当然如果业务上能接受 t2 的变化，不触发 mv1 的刷新，可以通过物化视图的属性`excluded_trigger_tables`来设置

2. 物化视图占用资源过多，影响其他业务怎么办？

   可以通过物化视图的属性指定`workload_group`来控制物化视图刷新任务的资源

   使用时需要注意，如果内存设置的太小，单个分区刷新又需要的内存较多，任务会刷新失败。需要根据业务情况进行权衡

3. 能基于物化视图创建新的物化视图么

   能。2.1.3 开始支持。但是刷新数据的时候，每个物化视图都是单独的刷新逻辑

   例如 mv2 基于 mv1 创建，mv1 基于 t1 创建

   那么 mv2 刷新的时候不会考虑 mv1 相对于 t1 数据是否同步

4. 都支持哪些外表？

   doris 支持的所有外表都能用于创建物化视图，但是目前仅有 hive 支持分区刷新，后续会陆续支持

5. 物化视图显示和 hive 数据一致，但是实际上不一致

   物化视图仅能保证物化视图的数据和通过 Catalog 查询的结果一致
   
   Catalog 有一定的元数据，数据缓存。

   如果想物化视图和 Hive 数据一致，需要通过 Refresh Catalog 等方式，确保 Catalog 的数据和 Hive 的数据一致

6. 物化视图支持 Schema Change 么？

   不支持修改，因为物化视图的列属性是根据物化视图定义 SQL 推导出来的。目前不支持显示的自定义修改

7. 物化视图使用的基表允许 Schema Change 么？

   允许。但是变更之后，使用到该基表的物化视图的 State 会由 `NORMAL` 变为 `SCHEMA_CHANGE`，此时物化视图将不能被用来透明改写，但是不影响直查物化视图

   如果物化视图下次刷新任务成功，那么 State 会由 `SCHEMA_CHANGE` 变回 `NORMAL`

8. 主键模型的表能用来创建物化视图么？

   物化视图对基表的数据模型没有要求。但是物化视图本身只能是明细模型。

9. 物化视图上还能建索引么？

   能

10. 物化视图刷新的时候会锁表么？

    很小的阶段会锁表，不会持续的占用表锁（几乎等同于导入数据的锁表时间）

11. 物化视图适合近实时场景么？

    不太适合。物化视图刷新的最小单位是分区，如果数据量较大会占用较多的资源，并且不够实时。可以考虑同步物化视图或其他手段。

## 使用场景
### 查询加速
对于 BI 报表场景以及其他加速场景，查询通常是多张表进行 Join 计算，之后进行聚合计算，用户对于查询的响应时间敏感，一般需要在秒级别返回多条查询结果，会消耗大量计算资源，并且有时很难保证预期的响应时间，此时多表物化视图可以解决此问题。

物化视图对于加速重复有规律的查询很有效。物化视图视图支持直查，也支持透明改写，透明改写指的是使用一组物化视图，优化器根据改写算法和代价模型自动选择可用的最优物化视图来响应查询。

使用物化视图的预计算结果来响应查询。极大地降低了表连接和聚合操作使用的资源，减少查询响应时间。

### 数据湖加速
#### 需求背景
很多用户有基于 Apache Doris 进行联邦数据查询的需求，Apache Doris 的多源数据目录（Multi-Catalog）功能让这件事变的很方便，只要创建一个 Catalog，无须把数据迁移到 Apache Doris，就可以通过 Apache Doris 对外部数据进行查询
#### 痛点
但是这也会造成一些问题，因为查询外部数据的速度可能会收到网络及第三方服务的影响，又可能会很慢，对于响应速度要求比较高的场景，很难满足需求
#### 如何实现外表的查询加速
异步物化视图可以基于外部 Catalog 来创建，但是物化视图本身的数据是存在 Apache Doris 内部的，所以查询物化视图的速度会很快。因此，对于响应速度要求比较高的场景，我们可以基于外部 Catalog 创建一个物化视图

### 数据建模
有些场景，用户会使用事实表和维度表加工成一张汇总表，之后对此汇总表进行 Ad hoc 查询，此汇总表也可作为基础指标表用于后续的建模。
    
此时可以利用物化视图对基表的数据进行建模。之后，还可以利用创建好的物化视图创建更高层级的物化视图（2.1.3 支持），灵活满足不同的需求。

不同层级的物化视图都可以自己设置刷新方式，例如：
- 第一层的物化视图可以设置为定时刷新，第二层的设置为触发刷新，那么第一层的物化视图刷新完成后，会自动触发第二层物化视图的刷新。
- 每层的物化视图都设置为定时刷新，那么第二层物化视图刷新的时候，不会考虑第一层的物化视图数据是否和基表同步，只会把第一层物化视图的数据加工后同步到第二层。

## 物化视图和 Olap 的关系
注意：2.1.4 版本开始支持。

物化视图底层是一个 Duplicate 模型的 Olap 表。

理论上支持 Duplicate 模型的所有功能，但是物化视图为了能正常高效刷新数据，所以对功能做了一些限制：
1. 物化视图的分区是基于基表自动创建维护的，所以不能对物化视图进行分区操作
2. 由于物化视图背后有相关的 Job 要处理，所以不能用删除 Table 或重命名 Table 的命令操作物化视图，需要使用物化视图自身的命令
3. 物化视图的 Column 是根据查询语句推导出来的，所以不能修改，否则会导致物化视图的刷新任务失败
4. 物化视图有一些 Duplicate Table 没有的 Property，这部分 Property 需要通过物化视图的命令进行修改，其他公用的 Property 需要用 Alter Table 进行修改
5. 目前不能对异步物化视图创建 ROLLUP，但是能创建索引
6. `desc`，`show partitions` 等命令同样适用于物化视图

## 物化视图的使用

请参阅 [查询异步物化视图](./query-async-materialized-view.md)

## 注意事项

- 异步物化视图仅支持在[Nereids 优化器](../../query/nereids/nereids-new.md)使用
