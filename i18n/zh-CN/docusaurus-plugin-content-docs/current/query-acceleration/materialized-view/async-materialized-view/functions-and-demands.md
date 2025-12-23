---
{
    "title": "创建、查询与维护异步物化视图",
    "language": "zh-CN",
    "description": "本文将详细说明物化视图创建、物化视图直查、查询改写和物化视图常见运维。"
}
---

本文将详细说明物化视图创建、物化视图直查、查询改写和物化视图常见运维。

## 物化视图创建

### 权限说明

- 创建物化视图：需要具有物化视图的创建权限（与建表权限相同）以及创建物化视图查询语句的查询权限（与 SELECT 权限相同）。

### 创建语法

```sql
CREATE MATERIALIZED VIEW 
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ] 
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [refresh_trigger]]
    [ [DUPLICATE] KEY (<key_cols>) ]
    [ COMMENT '<table_comment>' ]
    [ PARTITION BY (
        { <partition_col> 
            | DATE_TRUNC(<partition_col>, <partition_unit>) }
                    )]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]               
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ]) 
    ]
    AS <query>
```

### 刷新配置

#### build_mode 刷新时机
物化视图创建完成是否立即刷新。
- IMMEDIATE：立即刷新，默认方式。
- DEFERRED：延迟刷新。

#### refresh_method 刷新方式
- COMPLETE：刷新所有分区。
- AUTO：尽量增量刷新，只刷新自上次物化刷新后数据变化的分区，如果不能感知数据变化的分区，只能退化成全量刷新，刷新所有分区。

#### refresh_trigger 触发方式
- **`ON MANUAL` 手动触发**

  用户通过 SQL 语句触发物化视图的刷新，策略如下

  检测基表的分区数据自上次刷新后是否有变化，刷新数据变化的分区。

  ```sql
  REFRESH MATERIALIZED VIEW mvName AUTO;
  ```

  :::tip 提示
  如果物化视图定义 SQL 使用的基表是 JDBC 表，Doris 无法感知表数据变化，刷新物化视图时需要指定 `COMPLETE`。
  如果指定了 AUTO，会导致基表有数据，但是刷新后物化视图没数据。
  刷新物化视图时，目前 Doris 只能感知内表和 Hive 数据源表数据变化，其他数据源逐步支持中。
  :::

  不校验基表的分区数据自上次刷新后是否有变化，直接刷新物化视图的所有分区。

  ```sql
  REFRESH MATERIALIZED VIEW mvName COMPLETE;
  ```

  只刷新指定的分区。

  ```sql
  REFRESH MATERIALIZED VIEW mvName partitions(partitionName1,partitionName2);
  ```

  :::tip 提示
  `partitionName` 可以通过 `SHOW PARTITIONS FROM mvName` 获取。
  从 2.1.3 版本开始支持 Hive 检测基表的分区数据自上次刷新后是否有变化，其他外表暂时还不支持。内表一直支持。
  :::

- **`ON SCHEDULE` 定时触发**

  通过物化视图的创建语句指定间隔多久刷新一次数据，refreshUnit(刷新时间间隔单位)可以是 minute， hour，day，week 等。

  如下，要求全量刷新 (`REFRESH COMPLETE`)，物化视图每 10 小时刷新一次，并且刷新物化视图的所有分区。

  ```sql
  CREATE MATERIALIZED VIEW mv_6
  REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
  AS
  SELECT * FROM lineitem;
  ```
    
  如下，尽量增量刷新 (`REFRESH AUTO`)，只刷新自上次物化刷新后数据变化的分区，如果不能增量刷新，就刷新所有分区，物化视图每 10 小时刷新一次（从 2.1.3 版本开始能自动计算 Hive 需要刷新的分区）。
  
    ```sql
    CREATE MATERIALIZED VIEW mv_7
    REFRESH AUTO ON SCHEDULE EVERY 10 hour
    PARTITION by(l_shipdate)
    AS
  SELECT * FROM lineitem;
  ```

- **`ON COMMIT` 自动触发**

  :::tip 提示
  自 Apache Doris 2.1.4 版本起支持此功能。
  :::

  基表数据发生变更后，自动触发相关物化视图刷新，刷新的分区范围与"定时触发"一致。

  如果物化视图的创建语句如下，那么当 基表 `lineitem` 的 `t1` 分区数据发生变化时，会自动触发物化视图的对应分区刷新。

  ```sql
  CREATE MATERIALIZED VIEW mv_8
  REFRESH AUTO ON COMMIT
  PARTITION by(l_shipdate)
  AS
  SELECT * FROM lineitem;
  ```

  :::caution 注意
  如果基表的数据频繁变更，不太适合使用此种触发方式，因为会频繁构建物化刷新任务，消耗过多资源。
  :::

  详情参考 [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW)


#### 示例如下
建表语句
```sql
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
    (FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
    DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
(2, 4, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
(3, 2, 4, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-19', '2023-10-19', '2023-10-19', 'a', 'b', 'yyyyyyyyy');

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
FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;

INSERT INTO orders VALUES
(1, 1, 'o', 9.5, '2023-10-17', 'a', 'b', 1, 'yy'),
(1, 1, 'o', 10.5, '2023-10-18', 'a', 'b', 1, 'yy'),
(2, 1, 'o', 11.5, '2023-10-19', 'a', 'b', 1, 'yy'),
(3, 1, 'o', 12.5, '2023-10-19', 'a', 'b', 1, 'yy');
    
CREATE TABLE IF NOT EXISTS partsupp (
      ps_partkey     INTEGER NOT NULL,
      ps_suppkey     INTEGER NOT NULL,
      ps_availqty    INTEGER NOT NULL,
      ps_supplycost  DECIMALV3(15,2)  NOT NULL,
      ps_comment     VARCHAR(199) NOT NULL 
    )
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES
(2, 3, 9, 10.01, 'supply1'),
(4, 3, 10, 11.01, 'supply2'),
(2, 3, 10, 11.01, 'supply3');
```

#### 刷新机制示例一

如下，刷新时机是创建完立即刷新 `BUILD IMMEDIATE`，刷新方式尽量增量刷新 `REFRESH AUTO`，
只刷新自上次物化刷新后数据变化的分区，如果不能增量刷新，就刷新所有分区。
触发方式是手动 `ON MANUAL`。对于非分区全量物化视图，只有一个分区，如果基表数据发生变化，意味着要全量刷新。

```sql
CREATE MATERIALIZED VIEW mv_1_0
BUILD IMMEDIATE 
REFRESH AUTO
ON MANUAL    
DISTRIBUTED BY RANDOM BUCKETS 2   
AS   
SELECT   
  l_linestatus,   
  to_date(o_orderdate) as date_alias,   
  o_shippriority   
FROM   
  orders   
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 刷新机制示例二
如下，刷新时机是延迟刷新 `BUILD DEFERRED`，刷新方式是全量刷新 `REFRESH COMPLETE`，
触发时机是定时刷新 `ON SCHEDULE`，首次刷新时间是 `2024-12-01 20:30:00`, 并且每隔一天刷新一次。
如果 `BUILD DEFERRED` 指定为 `BUILD IMMEDIATE`，创建完物化视图会立即刷新一次。之后从 `2024-12-01 20:30:00` 每隔一天刷新一次。

:::tip 提示
STARTS 的时间要晚于当前的时间
:::

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD DEFERRED
REFRESH COMPLETE
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'  
PROPERTIES ('replication_num' = '1')   
AS   
SELECT   
l_linestatus,   
to_date(o_orderdate) as date_alias,   
o_shippriority   
FROM   
orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 刷新机制示例三

如下，刷新时机是创建完立即刷新 `BUILD IMMEDIATE`，刷新方式是全量刷新 `REFRESH COMPLETE`，
触发方式是触发刷新 `ON COMMIT`，当 orders 或者 lineitem 表数据发生变化的时候，会自动触发物化视图的刷新。

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD IMMEDIATE
REFRESH COMPLETE
ON COMMIT
PROPERTIES ('replication_num' = '1')   
AS   
SELECT   
l_linestatus,   
to_date(o_orderdate) as date_alias,   
o_shippriority   
FROM   
orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

### 分区配置

如下，创建分区物化视图时，需要指定 `PARTITION BY`，对于分区字段引用的表达式，仅允许使用 `date_trunc` 函数和标识符。
以下语句是符合要求的：
分区字段引用的列仅使用了 `date_trunc` 函数。分区物化视图的刷新方式一般是 `AUTO`，即尽量增量刷新，只刷新自上次物化刷新后数据变化的分区，如果不能增量刷新，就刷新所有分区。

```sql
CREATE MATERIALIZED VIEW mv_2_0 
BUILD IMMEDIATE
REFRESH AUTO
ON MANUAL   
PARTITION BY (order_date_month)   
DISTRIBUTED BY RANDOM BUCKETS 2   
AS   
SELECT   
  l_linestatus,
  date_trunc(o_orderdate, 'month') as order_date_month,   
  o_shippriority   
FROM   
  orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

如下语句创建分区物化视图会失败，因为分区字段 `order_date_month` 使用了 `date_add()` 函数，报错 `because column to check use invalid implicit expression, invalid expression is days_add(o_orderdate#4, 2)`。

```sql
CREATE MATERIALIZED VIEW mv_2_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL   
PARTITION BY (order_date_month)   
DISTRIBUTED BY RANDOM BUCKETS 2   
AS   
SELECT   
  l_linestatus,
  date_trunc(date_add(o_orderdate, INTERVAL 2 DAY), 'month') as order_date_month,   
  o_shippriority   
FROM   
  orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 基表有多列分区

目前仅支持 Hive 外表有多列分区。Hive 外表有很多多级分区的情况，例如一级分区按照日期，二级分区按照区域。物化视图可以选择 Hive 的某一级分区列作为物化视图的分区列。

例如，Hive 的建表语句如下：

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

当物化视图的创建语句如下时，物化视图`mv_hive`将有三个分区：`('2020')，('2021')，('2022')`

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1,year,region FROM hive1;
```

当物化视图的建表语句如下时，那么物化视图`mv_hive2`将有如下两个分区：`('bj')`，`('sh')`：

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1,year,region FROM hive1;
```

#### 使用基表部分分区

有些基表有很多分区，但是物化视图只关注最近一段时间的"热"数据，那么可以使用此功能。

基表的建表语句如下：

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
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

物化视图的创建语句如以下，代表物化视图只关注最近一天的数据。若当前时间为 2024-03-28 xx:xx:xx，这样物化视图会仅有一个分区 `[("2024-03-28"),("2024-03-29")]`：

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
partition by(`k2`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'partition_sync_limit'='1',
'partition_sync_time_unit'='DAY'
)
AS
SELECT * FROM t1;
```

若时间又过了一天，当前时间为` 2024-03-29 xx:xx:xx`，`t1`则会新增一个分区 `[("2024-03-29"),("2024-03-30")]`，若此时刷新物化视图，刷新完成后，物化视图会仅有一个分区 `[("2024-03-29"),("2024-03-30")]`。

此外，分区字段是字符串类型时，可以设置物化视图属性 `partition_date_format`，例如 `%Y-%m-%d` 。

#### 分区上卷

:::tip 提示
自 Doris 2.1.5 版本起支持 Range 分区
:::

当基表数据经过聚合处理后，各分区的数据量可能会显著减少。在这种情况下，可以采用分区上卷策略，以降低物化视图的分区数量。

假设基表的建表语句如下：

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
    DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

若物化视图的创建语句如下，则该物化视图将包含两个分区：`[("2020-01-01","2020-02-01")] `和` [("2020-02-01","2020-03-01")]`

```sql
    CREATE MATERIALIZED VIEW mv_3
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'month'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    AS
    SELECT * FROM t1;
```

若物化视图的创建语句如下，则该物化视图将只包含一个分区：`[("2020-01-01","2021-01-01")]`

```sql
    CREATE MATERIALIZED VIEW mv_4
    BUILD DEFERRED REFRESH AUTO ON MANUAL
    partition by (date_trunc(`k2`,'year'))
    DISTRIBUTED BY RANDOM BUCKETS 2
    AS
    SELECT * FROM t1;
```

此外，如果分区字段为字符串类型，可以通过设置物化视图的 `partition_date_format` 属性来指定日期格式，例如 `'%Y-%m-%d'`。

详情参考 [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW)

#### 分区多端刷新
“多端刷新” 允许异步物化视图有多个分区追踪表，即允许多个表的数据发生变化，物化视图都只进行分区刷新，而不是全量刷新。

该特性在使用中存在以下限制：
- 仅支持基于 INNER JOIN 或 UNION (包括 UNION ALL) 所构建的物化视图。
- 当物化视图使用 UNION 操作时，所有参与联合的部分都必须支持分区变化追踪（PCT）。 例如物化视图的 sql 定义为：q1 union all q2, 那么要求单独使用 q1 或 q2 创建物化视图都能进行分区刷新，且推导出的分区字段的顺序一致。
- 多 PCT 表间的分区粒度要对齐
  - 允许的示例：
  
    基表 t1 的分区：[2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)
  
    基表 t2 的分区：[2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)
  
    多个基表的分区不完全一致，但是没有交叉

  - 不允许的示例：
  
    基表 t1 的分区：[2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)
  
    基表 t2 的分区：[2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)

    [2020-01-01, 2020-01-03) 和 [2020-01-01, 2020-01-02) 有交叉又不完全一样

### SQL 定义

异步物化视图支持基于内部视图（View）进行创建，但不支持基于外部数据源中的视图构建。

需要注意的是，当所依赖的内部视图发生修改或重建时，会导致异步物化视图与基表之间的数据不一致。此时，虽然物化视图中的数据仍然存在，但无法支持查询的透明改写。

此外，如果结构变更影响了异步物化视图所依赖的分区追踪表或字段，或使其 Schema 发生变化，该物化视图将无法刷新成功。若变更未影响上述元素，则刷新物化视图后，即可恢复正常使用。

## 直查物化视图

物化视图可以看作是表，可以对物化视图添加过滤条件和聚合等，进行直接查询。

**物化视图的定义：**
```sql
CREATE MATERIALIZED VIEW mv_5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

**原查询如下**

```sql
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE o_orderdate = '2023-10-18';
```

**等价的直查物化语句如下**，用户需要手动修改查询

```sql
SELECT
l_linenumber,
o_custkey
FROM mv_5
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

## 查询透明改写

透明改写指在处理查询时，用户无需手动修改查询，系统会自动优化并改写查询。
Doris 异步物化视图采用基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式的透明改写算法。
该算法能够分析 SQL 的结构信息，自动寻找合适的物化视图进行透明改写，并选择最优的物化视图来响应查询 SQL。
Doris 提供了丰富且全面的透明改写能力。例如下面这些能力：

### 条件补偿

查询和物化视图的条件不必完全相同，通过在物化视图上补偿条件来表达查询，可以最大限度地复用物化视图，不用重复构建物化视图。

当物化视图和查询的 `where` 条件是通过 `and` 连接的表达式时：

1. **当查询的表达式包含物化视图的表达式时：**
    
    可以进行条件补偿。
    
    例如，查询是 `a > 5 and b > 10 and c = 7`，物化的条件是 `a > 5 and b > 10`，物化视图的条件是查询条件的子集，那么只需补偿 `c = 7` 条件即可。

2. **当查询的表达式不完全包含物化视图的表达式时：**
    
    查询的条件可以推导出物化视图的条件时（常见的是比较和范围表达式，如 `>`、`<`、`=`、`in` 等），也可以进行条件补偿。补偿结果就是查询条件本身。
    
    例如，查询是 `a > 5 and b = 10`，物化视图是 `a > 1 and b > 8`，可见物化的条件包含了查询的条件，查询的条件可以推导出物化视图的条件，这样也可以进行补偿，补偿结果就是 `a > 5 and b = 10`。
    
    条件补偿使用限制：
    
    1. 对于通过 `or` 连接的表达式，不能进行条件补偿，必须一样才可以改写成功。
    
    2. 对于 `like` 这种非比较和范围表达式，不能进行条件补偿，必须一样才可以改写成功。
    
    例如
    
    **物化视图定义：**
      ```sql
      CREATE MATERIALIZED VIEW mv1
      BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
      DISTRIBUTED BY RANDOM BUCKETS 3
      AS
      SELECT t1.l_linenumber,
             o_custkey,
             o_orderdate
      FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
      LEFT OUTER JOIN orders
      ON l_orderkey = o_orderkey;
      ```
    
    如下查询都可以命中物化视图，多个查询通过透明改写可以复用一个物化视图，
    减少查询改写时间，节省物化视图构建成本。

    ```sql
    SELECT l_linenumber,
           o_custkey,
           o_orderdate
    FROM lineitem
    LEFT OUTER JOIN orders
    ON l_orderkey = o_orderkey
    WHERE l_linenumber > 2;
    ```
  
    ```sql
    SELECT l_linenumber,
           o_custkey,
           o_orderdate
    FROM lineitem
    LEFT OUTER JOIN orders
    ON l_orderkey = o_orderkey
    WHERE l_linenumber > 2 and o_orderdate = '2023-10-19';
    ```

### JOIN 改写

JOIN 改写指的是查询和物化使用的表相同，可以在物化视图和查询的 JOIN 输入或者 JOIN 的外层写 `where`，优化器对此模式的查询会尝试进行透明改写。

支持多表 JOIN，支持的 JOIN 类型为：

- INNER JOIN

- LEFT OUTER JOIN

- RIGHT OUTER JOIN

- FULL OUTER JOIN

- LEFT SEMI JOIN

- RIGHT SEMI JOIN

- LEFT ANTI JOIN

- RIGHT ANTI JOIN

例如：

**物化视图定义：**

```sql
CREATE MATERIALIZED VIEW mv2
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

如下查询可进行透明改写，条件 `l_linenumber > 1` 可以上拉，从而进行透明改写，使用物化视图的预计算结果来表达查询。
命中物化视图后，可以节省 join 计算。

**查询语句：**

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```

### JOIN 衍生

当查询和物化视图的 JOIN 类型不一致时，如果物化视图能够提供查询所需的所有数据，那么通过在 JOIN 的外部补偿谓词，也可以进行透明改写。

例如

**物化视图定义：**

```sql
CREATE MATERIALIZED VIEW mv3
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
l_shipdate,
l_suppkey,
o_orderdate;
```

**查询语句：**

```sql
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_suppkey = 3
GROUP BY
l_shipdate,
l_suppkey,
o_orderdate;
```

### 聚合改写

当查询和物化视图定义中的 group 维度一致时，如果物化视图使用的 group by 维度和查询的 group by 维度相同，并且查询使用的聚合函数可以使用物化视图的聚合函数来表示，那么可以进行透明改写。

例如

**物化视图定义**

```sql
CREATE MATERIALIZED VIEW mv4
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
GROUP BY
o_shippriority,
o_comment;
```

如下查询可以进行透明改写，因为查询和物化视图使用的聚合维度一致，可以使用物化视图 `o_shippriority` 字段进行过滤结果。查询中的 group by 维度和聚合函数可以使用物化视图的 group by 维度和聚合函数来改写。
命中聚合物化视图后，可以减少聚合计算。

**查询语句：**

```sql
SELECT 
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
WHERE o_shippriority in (1, 2)
GROUP BY
o_shippriority,
o_comment;
```

### 聚合改写（上卷）

在查询和物化视图定义中，即使聚合的维度不一致，也可以进行改写。物化视图使用的 `group by` 维度需要包含查询的 `group by` 维度，而查询可以没有 `group by`。并且，查询使用的聚合函数可以用物化视图的聚合函数来表示。

例如

**物化视图定义：**

```sql
CREATE MATERIALIZED VIEW mv5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, o_orderdate, l_partkey, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    bitmap_union(to_bitmap(CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END)) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
l_shipdate,
o_orderdate,
l_partkey,
l_suppkey;
```

以下查询可以进行透明改写。查询和物化视图使用的聚合维度不一致，但物化视图使用的维度包含了查询的维度。查询可以使用维度中的字段对结果进行过滤。查询会尝试使用物化视图 `SELECT` 后的函数进行上卷，
例如，物化视图的 `bitmap_union` 最后会上卷成 `bitmap_union_count`，这和查询中的 `count(distinct)` 的语义保持一致。

通过聚合上卷，同一个物化视图可以被多个查询复用，节省物化视图构建成本。

**查询语句：**

```sql
SELECT
    l_shipdate, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_partkey = 3
GROUP BY
l_shipdate,
l_suppkey;
```

目前支持的聚合上卷函数列表如下：

| 查询中函数                                                 | 物化视图中函数                                  | 函数上卷后         |
|-------------------------------------------------------|------------------------------------------| ------------------ |
| max                                                   | max                                      | max                |
| min                                                   | min                                      | min                |
| sum                                                   | sum                                      | sum                |
| count                                                 | count                                    | sum                |
| count(distinct)                                       | bitmap_union                             | bitmap_union_count |
| bitmap_union                                          | bitmap_union                             | bitmap_union       |
| bitmap_union_count                                    | bitmap_union                             | bitmap_union_count |
| hll_union_agg, approx_count_distinct, hll_cardinality | hll_union 或者 hll_raw_agg                 | hll_union_agg      |
| any_value                                             | any_value 或者 select 后有 any_value 使用的列      | any_value      |

### 多维聚合改写

支持多维聚合的透明改写，即如果物化视图中没有使用 `GROUPING SETS`, `CUBE`, `ROLLUP`，而查询中有多维聚合，并且物化视图 `group by` 后的字段包含查询中多维聚合的所有字段，那么也可以进行透明改写。

例如

**物化视图定义：**

```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
select o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice) as sum_total,
       max(o_totalprice) as max_total,
       min(o_totalprice) as min_total,
       count(*) as count_all
from orders
group by
o_orderstatus, o_orderdate, o_orderpriority;
```

如下查询可以命中物化视图，复用了物化视图的聚合结果，节省计算

**查询语句：**

```sql
select o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice),
       max(o_totalprice),
       min(o_totalprice),
       count(*)
from orders
group by
GROUPING SETS ((o_orderstatus, o_orderdate), (o_orderpriority), (o_orderstatus), ());
```

### 分区补偿改写

当分区物化视图不足以提供查询的所有数据时，可以使用 `union all` 的方式，将查询原表和物化视图的数据 `union all` 作为最终返回结果。

例如

**物化视图定义：**

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
as
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

当基表新增分区 `2023-10-21` 时，并且物化视图还未刷新时，可以通过物化视图 `union all` 原表的方式返回结果。

```sql
insert into lineitem values
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

**查询语句：**

```sql
select l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

查询可以部分使用物化预计算的结果，节省了这部分的计算。

**改写结果示意：**

```sql
SELECT *
FROM mv7
union all
select t1.l_shipdate, o_orderdate, t1.l_partkey, t1.l_suppkey, sum(o_totalprice) as sum_total
from (select * from lineitem where l_shipdate = '2023-10-21') t1
left join orders on t1.l_orderkey = orders.o_orderkey and t1.l_shipdate = o_orderdate
group by
    t1.l_shipdate,
    o_orderdate,
    t1.l_partkey,
    t1.l_suppkey;
```

:::caution 注意
目前支持分区补偿，暂时不支持带条件的 `UNION ALL` 补偿。

比如，如果物化视图带有 `where` 条件，以上述为例，如果构建物化的过滤条件加上 ` WHERE l_shipdate > '2023-10-19'`，而查询是 `WHERE l_shipdate > '2023-10-18'`，目前这种还无法通过 `UNION ALL` 补偿，待支持。
:::

:::info 备注
从 3.1.0 版本开始
分区补偿改写功能支持以下类型的分区表：内表、Hive、Iceberg 与 Paimon。这意味着，仅当分区物化视图是基于上述类型的分区表构建时，才能触发分区补偿改写机制。
:::

### 嵌套物化视图改写

物化视图的定义 SQL 可以使用物化视图，此物化视图称为嵌套物化视图。
嵌套的层数理论上没有限制，此物化视图既可以直查，也可以进行透明改写。嵌套物化视图同样可以参与透明改写。

例如

**创建内层物化视图 `mv8_0_inner_mv`：**

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
select
l_linenumber,
o_custkey,
o_orderkey,
o_orderstatus,
l_partkey,
l_suppkey,
l_orderkey
from lineitem
inner join orders on lineitem.l_orderkey = orders.o_orderkey;
```

**创建外层物化视图 `mv8_0`：**

```sql
CREATE MATERIALIZED VIEW mv8_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
select
l_linenumber,
o_custkey,
o_orderkey,
o_orderstatus,
l_partkey,
l_suppkey,
l_orderkey,
ps_availqty
from mv8_0_inner_mv
inner join partsupp on l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```

对于以下查询，`mv8_0_inner_mv` 和 `mv8_0` 都会成功进行改写，最终代价模型会选择 `mv8_0`。

嵌套物化视图常用于数据建模和特别复杂的查询，如果单独构建一个物化视图无法透明改写，可以将复杂的查询拆分，构建嵌套物化视图，透明改写会尝试使用嵌套物化视图改写，
如果改写成功，会节省计算，提高查询性能。

```sql
select lineitem.l_linenumber
from lineitem
inner join orders on l_orderkey = o_orderkey
inner join partsupp on  l_partkey = ps_partkey AND l_suppkey = ps_suppkey
where o_orderstatus = 'o'
```

注意：

1. 嵌套物化视图的层数越多，透明改写的耗时会相应增加。建议嵌套物化视图层数不要超过 3 层。

2. 嵌套物化视图透明改写默认关闭，开启方式见下面的相关设置。


### 聚合查询使用非聚合物化视图改写
如果查询是聚合查询，物化视图不包含聚合，但是物化视图可以提供查询使用的所有列，那么也可以改写，比如查询先是 join
连接，之后是 group by 聚合，命中包含 join 连接的物化视图，那么也是有收益的。


```sql
CREATE MATERIALIZED VIEW mv10_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
as
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, o_totalprice
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate;
```

如下查询可以命中 mv10_0 的物化视图，节省了 `lineitem join orders` 连接的计算
```sql
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

### 窗口函数改写
当查询和物化视图都包含窗口函数时，如果窗口函数的定义完全匹配，可以进行透明改写。
窗口函数改写能够复用物化视图中预计算的窗口函数结果,显著提升包含复杂窗口计算的查询性能。
目前支持所有窗口函数的透明改写。


```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
as
select *
from (
  select 
  o_orderkey,
  FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate 
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
  RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus 
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
  from 
  orders
) t
where o_orderkey > 1;
```


如下查询可以命中 mv11_0 的物化视图，节省了窗口函数的计算，可以看到查询中的条件 `o_orderkey > 2` 和物化视图不一致，也可以改写成功
```sql
select *
from (
  select 
  o_orderkey,
  FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate 
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
  RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus 
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
  from 
  orders
) t
where o_orderkey > 2;
```

另一个例子

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
as
select 
o_orderkey,
o_orderdate,
FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate 
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus 
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
from 
orders
where o_orderdate > '2023-12-09';
```

如下查询可以命中 `mv11_1` 的物化视图，节省了窗口函数的计算，可以看到查询中的条件 `o_orderdate > '2023-12-10'` 和物化视图定义不一致。
`o_orderdate` 属于窗口函数的 partition by 字段，这种情况下，虽然查询条件 `o_orderdate > '2023-12-10'` 早于
window 函数执行，也可以进行透明改写。


```sql
select 
o_orderdate,
FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate 
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus 
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
from 
orders
where o_orderdate > '2023-12-10';
```
用例中使用的是单表，多表 join 场景下，窗口函数改写同样适用。


### Limit 和 TopN 改写
当查询包含 ORDER BY 或 LIMIT 子句，或者两者都有（即 Top-N 查询）时，如果物化视图能够提供足够的数据来满足查询的 ORDER BY 和 LIMIT 要求，
优化器可以利用该物化视图进行透明改写。这种改写能够显著加速常见的 Top-N 分析场景。

**改写条件**

ORDER BY 校验：查询的 ORDER BY 子句必须与物化视图的 ORDER BY 子句兼容或完全相同。

LIMIT 校验：
如果物化视图没有 LIMIT，任何带 LIMIT 的查询都可以尝试改写。
如果物化视图有 LIMIT N，那么查询的 LIMIT M 必须满足 M <= N，
如果物化视图有 LIMIT N OFFSET L，那么查询的 LIMIT M OFFSET O 必须满足 O >= L，且 M + O <= N + L。

物化视图和查询的其他 where 条件应该相同。


```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
as
select
o_orderdate,
count(o_shippriority),
count(o_comment),
l_orderkey,
count(l_partkey)
from
orders
left join
lineitem on l_orderkey = o_orderkey
left join partsupp on ps_partkey = l_partkey and l_suppkey = ps_suppkey
group by o_orderdate, l_orderkey
limit 8 offset 1;
```

如下查询可以命中 mv11_0 的物化视图， 满足上述的校验条件
```sql
select
o_orderdate,
count(o_shippriority),
count(o_comment),
l_orderkey,
count(l_partkey)
from
orders
left join lineitem on l_orderkey = o_orderkey
left join partsupp on ps_partkey = l_partkey and l_suppkey = ps_suppkey
group by o_orderdate, l_orderkey
limit 4 offset 2;
```


如下查询不可以命中 mv11_0 的物化视图， 因为多了一个 `o_orderdate > '2023-12-08'` 条件，如果 mv11_0 物化视图也有
`where o_orderdate > '2023-12-08'`条件，那么可以命中物化视图

```sql
select
o_orderdate,
count(o_shippriority),
count(o_comment),
l_orderkey,
count(l_partkey)
from
orders
left join lineitem on l_orderkey = o_orderkey
left join partsupp on ps_partkey = l_partkey and l_suppkey = ps_suppkey
where o_orderdate > '2023-12-08'
group by o_orderdate, l_orderkey
limit 4 offset 2;
```

另一个例子

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
as
select
o_orderdate,
o_shippriority,
o_comment,
l_orderkey,
l_partkey,
o_orderkey
from
orders left
join lineitem on l_orderkey = o_orderkey
left join partsupp on ps_partkey = l_partkey and l_suppkey = ps_suppkey
where o_orderdate > '2023-12-08'
order by o_orderkey
limit 4 offset 2;
```

如下查询中 order by + limit 会转化成 topN，可以命中 mv11_1 的物化视图， 满足上述的校验条件
```sql
select
o_orderdate,
o_shippriority,
o_comment,
l_orderkey,
l_partkey
from
orders left
join lineitem on l_orderkey = o_orderkey
left join partsupp on ps_partkey = l_partkey and l_suppkey = ps_suppkey
where o_orderdate > '2023-12-08'
order by o_orderkey
limit 2 offset 3;
```


### Explain 查询透明改写情况

查询透明改写命中情况，用于查看和调试。

1. **如果需要查看物化视图的透明改写命中情况，该语句会展示查询透明改写的简要过程信息。**

   ```sql
   explain <query_sql> 
   ```

   返回的信息如下，此处截取了与物化视图相关的信息：

    ```sql
    | MaterializedView                                                                                                                                                                                                                                      |
    | MaterializedViewRewriteSuccessAndChose:                                                                                                                                                                                                               |
    |   Names: mv5                                                                                                                                                                                                                                          |
    | MaterializedViewRewriteSuccessButNotChose:                                                                                                                                                                                                            |
    |                                                                                                                                                                                                                                                       |
    | MaterializedViewRewriteFail:                                                                                                                                                                                                                          |
    |   Name: mv4                                                                                                                                                                                                                                           |
    |   FailSummary: Match mode is invalid, View struct info is invalid                                                                                                                                                                                     |
    |   Name: mv3                                                                                                                                                                                                                                           |
    |   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid                                                                                                                                          |
    |   Name: mv1                                                                                                                                                                                                                                           |
    |   FailSummary: The columns used by query are not in view, View struct info is invalid                                                                                                                                                                 |
    |   Name: mv2                                                                                                                                                                                                                                           |
    |   FailSummary: The columns used by query are not in view, View struct info is invalid
    ```

  - MaterializedViewRewriteSuccessAndChose：表示透明改写成功，并且 CBO（Cost-Based Optimizer）选择的物化视图名称列表。
    - MaterializedViewRewriteSuccessButNotChose：表示透明改写成功，但是最终 CBO 没有选择的物化视图名称列表。
  - MaterializedViewRewriteFail：列举透明改写失败的情况及原因摘要。

2. **如果想了解物化视图的候选、改写以及最终选择情况的详细过程信息，可以执行如下语句：**

    ```sql
    explain memo plan <query_sql>
    ```


## 维护物化视图

### 权限说明

- 删除物化视图：需要具有物化视图的删除权限（与删除表权限相同）。

- 修改物化视图：需要具有物化视图的修改权限（与修改表权限相同）。

- 暂停/恢复/取消/刷新物化视图：需要具有物化视图的创建权限。

### 物化视图修改

#### 修改物化视图属性

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
  "grace_period" = "10"
);
```

#### 物化视图重命名，即物化视图原子替换

```sql

CREATE MATERIALIZED VIEW mv9_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1') 
AS
select
  l_linenumber,
  o_custkey,
  o_orderkey,
  o_orderstatus,
  l_partkey,
  l_suppkey,
  l_orderkey
from lineitem
inner join orders on lineitem.l_orderkey = orders.o_orderkey;
```

使用 mv9_0 的物化视图替换 mv7，并且删除 mv7。
```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```



### 物化视图删除
```sql
DROP MATERIALIZED VIEW mv_1;
```

详情参考 [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW)


### 查看物化视图创建语句
```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

详情参考 [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW)


### 暂停物化视图

详情参考 [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB)

### 启用物化视图

详情参考 [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB)

### 取消物化视图刷新任务

详情参考 [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK)


### 查询物化视图信息

```sql
SELECT * 
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G 
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

- **JobName：** 物化视图构建 Job 的名称，每个物化视图有一个 Job，每次刷新会有一个新的 Task，Job 和 Task 是 1:n 的关系

- **State：** 如果变为 SCHEMA_CHANGE，代表基表的 Schema 发生了变化，此时物化视图将不能用来透明改写 (但是不影响直接查询物化视图)，下次刷新任务如果执行成功，将恢复为 NORMAL。

- **SchemaChangeDetail：** 表示 SCHEMA_CHANGE 发生的原因。

- **RefreshState：** 物化视图最后一次任务刷新的状态。如果为 FAIL，代表执行失败，可以通过 `tasks() `命令进一步定位失败原因。Task 命令见本文[查询刷新任务 TASK 信息](### 查询刷新任务 TASK 信息)。

- **SyncWithBaseTables：** 是否和基表数据同步。1 为同步，0 为不同步。如果不同步，可通过 `show partitions` 进一步判断哪个分区不同步。`show partitions` 见下文分区物化视图查看 SyncWithBaseTables 状态方法。

对于透明改写，通常物化视图会出现两种状态：

- **状态正常：** 指的是当前物化视图是否可用于透明改写。

- **不可用、状态不正常：** 指的是物化视图不能用于透明改写的简称。尽管如此，该物化视图还是可以直查的。


详情参考 [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos)


### 查询刷新任务 TASK 信息

每个物化视图有一个 Job，每次刷新会有一个新的 Task，Job 和 Task 是 1:n 的关系。
根据物化视图名称查看物化视图的 Task 状态，运行如下语句，可以查看刷新任务的状态和进度：

```sql
SELECT * 
FROM tasks("type"="mv")
WHERE
MvDatabaseName = 'mv_db_name' and    
mvName = 'mv_name'
ORDER BY  CreateTime DESC \G
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

- RefreshMode：COMPLETE 代表刷新了全部分区，PARTIAL 代表刷新了部分分区，NOT_REFRESH 代表不需要刷新任何分区。

:::info 备注
- 目前 task 存储和展示的数量默认是 100个，可以通过在 fe.conf 文件中配置 max_persistence_task_count 修改数量，超过这个
数量将会丢弃旧的 task 记录, 如果值 < 1, 将不会持久化。修改完配置后需要重启 FE 才能生效。

- 如果物化视图创建的时候设置了 `grace_period` 属性，那么即使 `SyncWithBaseTables` 是 false 或者 0，有些情况下它依然可用于透明改写。

- `grace_period` 的单位是秒，指的是容许物化视图和所用基表数据不一致的时间。

- 如果设置成 0，意味着要求物化视图和基表数据保持一致，此物化视图才可用于透明改写。

- 如果设置成 10，意味着物化视图和基表数据允许 10 秒的延迟，如果物化视图的数据和基表的数据有延迟，在 10 秒内，此物化视图都可以用于透明改写。
  :::
  详情参考 [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks)


### 查询物化视图对应的 JOB

```sql
SELECT * 
FROM jobs("type"="mv") 
WHERE Name="inner_mtmv_75043";
```

详情参考 [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs)


### 查询物化视图的分区信息：

分区物化视图查看 SyncWithBaseTables 状态方法

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

详情参考 [SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS)


### 查看物化视图表结构

详情参考 [DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE)

### 相关配置
#### Session Variables 开关

| 开关                                                                           | 说明                                                                                                                              |
|------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| SET enable_nereids_planner = true;                                           | 异步物化视图只有在新优化器下才支持，所以物化视图透明改写没有生效时，需要开启新优化器                                                                                      |
| SET enable_materialized_view_rewrite = true;                                 | 开启或者关闭查询透明改写，从 2.1.5 版本开始默认开启                                                                                                   |
| SET materialized_view_rewrite_enable_contain_external_table = true;          | 参与透明改写的物化视图是否允许包含外表，默认不允许，如果物化视图的定义 SQL 中包含外表，也想参与到透明改写，可以打开此开关。                                                                |
| SET materialized_view_rewrite_success_candidate_num = 3;                     | 透明改写成功的结果集合，允许参与到 CBO 候选的最大数量，默认是 3。如果发现透明改写的性能很慢，可以考虑把这个值调小。                                                                   |
| SET enable_materialized_view_union_rewrite = true;                           | 当分区物化视图不足以提供查询的全部数据时，是否允许基表和物化视图 union all 来响应查询，默认允许。如果发现命中物化视图时数据错误，可以把此开关关闭。                                                 |
| SET enable_materialized_view_nest_rewrite = true;                            | 是否允许嵌套改写，默认不允许。如果查询 SQL 很复杂，需要构建嵌套物化视图才可以命中，那么需要打开此开关。                                                                          |
| SET materialized_view_relation_mapping_max_count = 8;                        | 透明改写过程中，relation mapping 最大允许数量，如果超过，进行截取。relation mapping 通常由表自关联产生，数量一般会是笛卡尔积，比如 3 张表，可能会产生 8 种组合。默认是 8。如果发现透明改写时间很长，可以把这个值调低 |
| SET enable_dml_materialized_view_rewrite = true;                             | DML 时，是否开启基于结构信息的物化视图透明改写，默认开启                                                                                                 |
| SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true; | DML 时，当物化视图存在无法实时感知数据的外表时，是否开启基于结构信息的物化视图透明改写，默认关闭                                                                              |

#### fe.conf 配置
- **job_mtmv_task_consumer_thread_num：** 此参数控制同时运行的物化视图刷新任务数量，默认是 10，超过这个数量的任务将处于 pending 状态
修改这个参数需要重启 FE 才可以生效。


