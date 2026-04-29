---
{
    "title": "创建、查询与维护异步物化视图",
    "language": "zh-CN",
    "description": "如何在 Doris 创建异步物化视图，并通过直查与透明改写加速查询？本文涵盖刷新策略、分区配置与运维操作。",
    "keywords": ["Doris 异步物化视图", "CREATE MATERIALIZED VIEW", "查询透明改写", "物化视图刷新", "分区物化视图", "嵌套物化视图"]
}
---

<!-- 知识类型：操作手册 + 参考文档 -->
<!-- 适用场景：使用 Doris 异步物化视图加速查询、构建数据建模、运维管理物化视图 -->

异步物化视图（Async Materialized View）是 Doris 提供的预计算加速能力。本文从用户实际使用流程出发，依次介绍：

- **创建物化视图**：包括语法、刷新策略与分区配置。
- **查询物化视图**：包括直查物化视图和查询透明改写。
- **运维物化视图**：包括修改、删除、监控与相关参数配置。

阅读前置 checklist：

- [ ] 已了解异步物化视图的基本概念与适用场景。
- [ ] 已开启新优化器（`enable_nereids_planner = true`）。
- [ ] 已掌握基础建表与 SQL 语法。

---

## 1. 创建物化视图

<!-- 知识类型：操作手册 -->
<!-- 适用场景：首次构建异步物化视图 -->

### 1.1 权限说明

创建物化视图需要满足以下两类权限：

- **物化视图创建权限**：与建表权限相同。
- **基表查询权限**：与 SELECT 权限相同（即物化视图定义 SQL 中所引用基表的查询权限）。

### 1.2 创建语法

异步物化视图的完整创建语法如下：

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

### 1.3 刷新配置

刷新配置由三类参数组成：**刷新时机（build_mode）**、**刷新方式（refresh_method）** 和 **触发方式（refresh_trigger）**。

#### 1.3.1 参数总览

| 参数类别 | 参数值        | 说明                                                                       |
| -------- | ------------- | -------------------------------------------------------------------------- |
| 刷新时机 | `IMMEDIATE`   | 创建完成后立即刷新（默认）。                                               |
| 刷新时机 | `DEFERRED`    | 创建完成后延迟刷新。                                                       |
| 刷新方式 | `COMPLETE`    | 全量刷新，刷新所有分区。                                                   |
| 刷新方式 | `AUTO`        | 尽量增量刷新；无法感知变化时退化为全量刷新。                               |
| 触发方式 | `ON MANUAL`   | 用户通过 SQL 语句手动触发刷新。                                            |
| 触发方式 | `ON SCHEDULE` | 按指定时间间隔定时触发。                                                   |
| 触发方式 | `ON COMMIT`   | 基表数据变更时自动触发（自 Apache Doris 2.1.4 起支持）。                   |

#### 1.3.2 ON MANUAL 手动触发

用户通过 SQL 语句触发物化视图的刷新，包括三种策略：

**策略一**：检测基表分区数据自上次刷新后是否有变化，仅刷新变化的分区。

```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```

:::tip 提示
- 如果物化视图定义 SQL 使用的基表是 JDBC 表，Doris 无法感知表数据变化，刷新时需指定 `COMPLETE`，否则会出现"基表有数据但物化视图无数据"的现象。
- 目前 Doris 仅能感知内表和 Hive 数据源表的数据变化，其他数据源逐步支持中。
:::

**策略二**：不校验基表分区数据变化，直接刷新物化视图的所有分区。

```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```

**策略三**：仅刷新指定分区。

```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1, partitionName2);
```

:::tip 提示
- `partitionName` 可通过 `SHOW PARTITIONS FROM mvName` 获取。
- 自 2.1.3 版本起支持 Hive 检测基表分区数据变化，其他外表暂不支持，内表始终支持。
:::

#### 1.3.3 ON SCHEDULE 定时触发

通过创建语句指定刷新间隔，`refreshUnit` 可以是 `minute`、`hour`、`day`、`week` 等。

**示例一**：全量刷新（`REFRESH COMPLETE`），每 10 小时刷新一次所有分区。

```sql
CREATE MATERIALIZED VIEW mv_6
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
AS
SELECT * FROM lineitem;
```

**示例二**：尽量增量刷新（`REFRESH AUTO`），每 10 小时刷新一次。仅刷新数据有变化的分区，无法增量时退化为全量刷新。

```sql
CREATE MATERIALIZED VIEW mv_7
REFRESH AUTO ON SCHEDULE EVERY 10 hour
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

:::tip 提示
自 2.1.3 版本起，可自动计算 Hive 表需要刷新的分区。
:::

#### 1.3.4 ON COMMIT 自动触发

:::tip 提示
自 Apache Doris 2.1.4 版本起支持此功能。
:::

基表数据变更后自动触发对应物化视图刷新，刷新分区范围与定时触发一致。

```sql
CREATE MATERIALIZED VIEW mv_8
REFRESH AUTO ON COMMIT
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

当基表 `lineitem` 的 `t1` 分区数据变化时，会自动触发物化视图对应分区的刷新。

:::caution 注意
如果基表数据频繁变更，不建议使用此触发方式，会频繁构建刷新任务，消耗过多资源。
:::

详情参考 [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW)。

#### 1.3.5 完整示例

下面通过一组完整示例演示刷新机制。先创建基表与初始化数据：

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

**示例一：立即增量刷新 + 手动触发**

刷新时机为创建后立即刷新（`BUILD IMMEDIATE`），刷新方式为尽量增量（`REFRESH AUTO`），触发方式为手动（`ON MANUAL`）。对于非分区全量物化视图只有一个分区，基表数据变化即意味着全量刷新。

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
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**示例二：延迟全量刷新 + 定时触发**

刷新时机为延迟刷新（`BUILD DEFERRED`），刷新方式为全量（`REFRESH COMPLETE`），首次刷新时间为 `2024-12-01 20:30:00`，之后每天刷新一次。

:::tip 提示
`STARTS` 的时间必须晚于当前时间。若指定为 `BUILD IMMEDIATE`，创建后会立即刷新一次，之后从 `2024-12-01 20:30:00` 起每天刷新一次。
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
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**示例三：立即全量刷新 + 自动触发**

刷新时机为立即刷新（`BUILD IMMEDIATE`），刷新方式为全量（`REFRESH COMPLETE`），触发方式为自动（`ON COMMIT`）。`orders` 或 `lineitem` 任一表数据变化都会自动触发刷新。

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
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

### 1.4 分区配置

<!-- 知识类型：操作手册 -->
<!-- 适用场景：构建分区物化视图、加速分区粒度的查询 -->

创建分区物化视图时需指定 `PARTITION BY`。**分区字段引用的表达式仅允许使用 `date_trunc` 函数和标识符。**

#### 1.4.1 合法的分区字段示例

分区字段引用的列仅使用 `date_trunc` 函数。分区物化视图的刷新方式一般为 `AUTO`。

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
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 1.4.2 非法的分区字段示例

下面的语句会创建失败，因为分区字段使用了 `date_add()` 函数。

```sql
CREATE MATERIALIZED VIEW mv_2_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (order_date_month)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    date_trunc(date_add(o_orderdate, INTERVAL 2 DAY), 'month') as order_date_month,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

报错信息：`because column to check use invalid implicit expression, invalid expression is days_add(o_orderdate#4, 2)`。

#### 1.4.3 基表多列分区

目前仅支持 Hive 外表多列分区。例如一级分区按日期、二级分区按区域，物化视图可选择任一级分区列作为自身的分区列。

Hive 建表语句：

```sql
CREATE TABLE hive1 (
    `k1` int)
PARTITIONED BY (
    `year` int,
    `region` string)
STORED AS ORC;

ALTER TABLE hive1 ADD IF NOT EXISTS
PARTITION(year=2020, region="bj")
PARTITION(year=2020, region="sh")
PARTITION(year=2021, region="bj")
PARTITION(year=2021, region="sh")
PARTITION(year=2022, region="bj")
PARTITION(year=2022, region="sh");
```

**场景一：以 `year` 作为分区列**，物化视图 `mv_hive` 将有三个分区 `('2020')`、`('2021')`、`('2022')`：

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

**场景二：以 `region` 作为分区列**，物化视图 `mv_hive2` 将有两个分区 `('bj')`、`('sh')`：

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

#### 1.4.4 仅使用基表部分分区

适用场景：基表分区很多，但物化视图仅需关注最近一段时间的"热"数据。

基表建表语句：

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

物化视图仅同步最近一天的数据。若当前时间为 `2024-03-28 xx:xx:xx`，则物化视图仅有一个分区 `[("2024-03-28"),("2024-03-29")]`：

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`k2`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
    'partition_sync_limit' = '1',
    'partition_sync_time_unit' = 'DAY'
)
AS
SELECT * FROM t1;
```

若时间过了一天到 `2024-03-29 xx:xx:xx`，`t1` 新增分区 `[("2024-03-29"),("2024-03-30")]`，刷新物化视图后，物化视图将仅有一个分区 `[("2024-03-29"),("2024-03-30")]`。

:::tip 提示
分区字段为字符串类型时，可设置物化视图属性 `partition_date_format`，例如 `%Y-%m-%d`。
:::

#### 1.4.5 分区上卷

:::tip 提示
自 Doris 2.1.5 版本起支持 Range 分区。
:::

**适用场景**：基表数据经聚合处理后，各分区数据量显著减少，可通过分区上卷降低物化视图的分区数量。

基表建表语句：

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

**按月上卷**：物化视图包含两个分区 `[("2020-01-01","2020-02-01")]` 和 `[("2020-02-01","2020-03-01")]`。

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

**按年上卷**：物化视图仅包含一个分区 `[("2020-01-01","2021-01-01")]`。

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

:::tip 提示
分区字段为字符串类型时，可通过设置 `partition_date_format` 属性指定日期格式，例如 `'%Y-%m-%d'`。
:::

详情参考 [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW)。

#### 1.4.6 分区多端刷新

**定义**：允许异步物化视图有多个分区追踪表，即多个表的数据发生变化时，物化视图都只进行分区刷新而非全量刷新。

**使用限制**：

- 仅支持基于 `INNER JOIN` 或 `UNION`（包括 `UNION ALL`）构建的物化视图。
- 当物化视图使用 `UNION` 操作时，所有参与联合的部分都必须支持分区变化追踪（PCT）。例如物化视图定义为 `q1 union all q2`，要求单独使用 `q1` 或 `q2` 创建物化视图都能进行分区刷新，且推导出的分区字段顺序一致。
- 多 PCT 表间的分区粒度需对齐：

    **允许的示例**：

    ```text
    基表 t1 的分区：[2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)
    基表 t2 的分区：[2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)
    ```

    多个基表分区不完全一致，但没有交叉。

    **不允许的示例**：

    ```text
    基表 t1 的分区：[2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)
    基表 t2 的分区：[2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)
    ```

    `[2020-01-01, 2020-01-03)` 和 `[2020-01-01, 2020-01-02)` 有交叉又不完全一样。

### 1.5 SQL 定义注意事项

异步物化视图支持基于内部视图（View）创建，但**不支持基于外部数据源中的视图**构建。

需要注意：

- 当所依赖的内部视图发生修改或重建时，会导致异步物化视图与基表之间的数据不一致。此时物化视图中的数据仍然存在，但无法支持查询的透明改写。
- 如果结构变更影响了异步物化视图所依赖的分区追踪表或字段，或使其 Schema 发生变化，物化视图将无法刷新成功。
- 若变更未影响上述元素，刷新物化视图后即可恢复正常使用。

---

## 2. 查询物化视图

<!-- 知识类型：操作手册 -->
<!-- 适用场景：使用物化视图加速查询 -->

物化视图查询有两种方式：**直查物化视图** 和 **查询透明改写**。

| 查询方式     | 是否需要修改原查询 | 适用场景                                       |
| ------------ | ------------------ | ---------------------------------------------- |
| 直查物化视图 | 是                 | 已知物化视图存在，希望显式使用其预计算结果。    |
| 查询透明改写 | 否                 | 希望对用户透明地利用物化视图加速查询。          |

### 2.1 直查物化视图

物化视图可视为一张表，可对其添加过滤条件、聚合等进行直接查询。

**物化视图定义**：

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

**原查询**：

```sql
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE o_orderdate = '2023-10-18';
```

**等价直查物化语句**（用户需手动改写）：

```sql
SELECT
    l_linenumber,
    o_custkey
FROM mv_5
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

### 2.2 查询透明改写

**透明改写**指系统在处理查询时自动优化并改写查询，用户无需手动修改。Doris 异步物化视图采用基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式的透明改写算法，能够分析 SQL 结构信息，自动寻找合适的物化视图，并选择最优结果响应查询。

下表汇总了 Doris 支持的透明改写能力：

| 改写能力           | 适用场景                                                      |
| ------------------ | ------------------------------------------------------------- |
| 条件补偿           | 查询和物化视图的 `WHERE` 条件不完全相同。                       |
| JOIN 改写          | 查询和物化使用相同表，且 JOIN 类型相同。                       |
| JOIN 衍生          | 查询和物化视图 JOIN 类型不一致，但物化视图能提供足够数据。      |
| 聚合改写           | 查询和物化视图的 group 维度一致。                              |
| 聚合改写（上卷）   | 物化视图维度包含查询维度，查询聚合函数可用物化视图函数表示。    |
| 多维聚合改写       | 物化视图无 `GROUPING SETS`/`CUBE`/`ROLLUP`，查询有多维聚合。     |
| 分区补偿改写       | 分区物化视图不足以提供查询全部数据时，与基表 `UNION ALL`。      |
| 嵌套物化视图改写   | 物化视图基于另一个物化视图构建。                               |
| 非聚合命中聚合查询 | 查询是聚合查询，物化视图不含聚合但能提供所需所有列。            |
| 窗口函数改写       | 查询和物化视图都包含窗口函数，且定义完全匹配。                  |
| Limit / TopN 改写  | 查询包含 `ORDER BY` 或 `LIMIT`，物化视图可满足要求。            |

#### 2.2.1 条件补偿

查询和物化视图的条件不必完全相同，通过在物化视图上补偿条件来表达查询，可最大限度复用物化视图。

当物化视图和查询的 `WHERE` 条件是通过 `AND` 连接的表达式时，分两种情况：

**情况一：查询的表达式包含物化视图的表达式时**，可以进行条件补偿。

例如，查询是 `a > 5 AND b > 10 AND c = 7`，物化视图条件是 `a > 5 AND b > 10`，物化视图条件是查询条件的子集，只需补偿 `c = 7` 条件即可。

**情况二：查询的表达式不完全包含物化视图的表达式时**，若查询条件可推导出物化视图条件（常见的是比较和范围表达式，如 `>`、`<`、`=`、`IN` 等），也可进行条件补偿，补偿结果为查询条件本身。

例如，查询是 `a > 5 AND b = 10`，物化视图是 `a > 1 AND b > 8`，物化条件包含查询条件，可补偿，补偿结果为 `a > 5 AND b = 10`。

**条件补偿使用限制**：

- 对于通过 `OR` 连接的表达式，不支持条件补偿，必须完全一样才能改写成功。
- 对于 `LIKE` 等非比较和范围表达式，不支持条件补偿，必须完全一样才能改写成功。

**示例**：

物化视图定义：

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

下面的多个查询都可命中物化视图，通过透明改写复用同一个物化视图，减少改写时间，节省构建成本：

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
WHERE l_linenumber > 2 AND o_orderdate = '2023-10-19';
```

#### 2.2.2 JOIN 改写

**适用场景**：查询和物化使用的表相同，可在物化视图和查询的 JOIN 输入或 JOIN 外层写 `WHERE`，优化器对此模式的查询会尝试透明改写。

**支持的 JOIN 类型**：

- `INNER JOIN`
- `LEFT OUTER JOIN`
- `RIGHT OUTER JOIN`
- `FULL OUTER JOIN`
- `LEFT SEMI JOIN`
- `RIGHT SEMI JOIN`
- `LEFT ANTI JOIN`
- `RIGHT ANTI JOIN`

**示例**：

物化视图定义：

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

下面的查询可透明改写，条件 `l_linenumber > 1` 可上拉，使用物化视图的预计算结果表达查询。命中物化视图后可节省 JOIN 计算：

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

#### 2.2.3 JOIN 衍生

当查询和物化视图的 JOIN 类型不一致时，如果物化视图能提供查询所需的所有数据，那么通过在 JOIN 外部补偿谓词，也可进行透明改写。

**示例**：

物化视图定义：

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

查询语句：

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

#### 2.2.4 聚合改写

**适用条件**：查询和物化视图定义中的 group 维度一致，且查询使用的聚合函数可用物化视图的聚合函数表示。

**示例**：

物化视图定义：

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

下面查询可透明改写：聚合维度一致，可用物化视图的 `o_shippriority` 字段过滤结果，group by 维度和聚合函数都能用物化视图改写。命中聚合物化视图后可减少聚合计算：

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
WHERE o_shippriority IN (1, 2)
GROUP BY
    o_shippriority,
    o_comment;
```

#### 2.2.5 聚合改写（上卷）

即使聚合维度不一致也可改写。要求：

- 物化视图的 `GROUP BY` 维度需包含查询的 `GROUP BY` 维度，查询可没有 `GROUP BY`。
- 查询的聚合函数可用物化视图的聚合函数表示。

**示例**：

物化视图定义：

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

下面查询可透明改写。物化视图维度包含查询维度，查询会尝试使用物化视图 `SELECT` 后的函数进行上卷。例如，物化视图的 `bitmap_union` 最终上卷为 `bitmap_union_count`，与查询中的 `count(distinct)` 语义一致。

通过聚合上卷，同一物化视图可被多个查询复用，节省构建成本：

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

**支持的聚合上卷函数列表**：

| 查询中函数                                              | 物化视图中函数                              | 函数上卷后           |
| ------------------------------------------------------- | ------------------------------------------- | -------------------- |
| `max`                                                   | `max`                                       | `max`                |
| `min`                                                   | `min`                                       | `min`                |
| `sum`                                                   | `sum`                                       | `sum`                |
| `count`                                                 | `count`                                     | `sum`                |
| `count(distinct)`                                       | `bitmap_union`                              | `bitmap_union_count` |
| `bitmap_union`                                          | `bitmap_union`                              | `bitmap_union`       |
| `bitmap_union_count`                                    | `bitmap_union`                              | `bitmap_union_count` |
| `hll_union_agg`, `approx_count_distinct`, `hll_cardinality` | `hll_union` 或 `hll_raw_agg`            | `hll_union_agg`      |
| `any_value`                                             | `any_value` 或 SELECT 后有 `any_value` 使用的列 | `any_value`          |

#### 2.2.6 多维聚合改写

支持多维聚合的透明改写：物化视图未使用 `GROUPING SETS`/`CUBE`/`ROLLUP`，查询有多维聚合，且物化视图 `GROUP BY` 字段包含查询多维聚合的所有字段。

**示例**：

物化视图定义：

```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice) AS sum_total,
       max(o_totalprice) AS max_total,
       min(o_totalprice) AS min_total,
       count(*) AS count_all
FROM orders
GROUP BY
    o_orderstatus, o_orderdate, o_orderpriority;
```

下面查询可命中物化视图，复用聚合结果，节省计算：

```sql
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice),
       max(o_totalprice),
       min(o_totalprice),
       count(*)
FROM orders
GROUP BY
    GROUPING SETS ((o_orderstatus, o_orderdate), (o_orderpriority), (o_orderstatus), ());
```

#### 2.2.7 分区补偿改写

**适用场景**：分区物化视图不足以提供查询的所有数据时，使用 `UNION ALL` 方式，将查询原表和物化视图的数据 `UNION ALL` 作为最终返回结果。

**示例**：

物化视图定义：

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

当基表新增分区 `2023-10-21` 且物化视图未刷新时，可通过物化视图 `UNION ALL` 原表方式返回结果。

```sql
INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

查询语句：

```sql
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

查询可部分使用物化预计算结果，节省了这部分的计算。

改写结果示意：

```sql
SELECT *
FROM mv7
UNION ALL
SELECT t1.l_shipdate, o_orderdate, t1.l_partkey, t1.l_suppkey, sum(o_totalprice) AS sum_total
FROM (SELECT * FROM lineitem WHERE l_shipdate = '2023-10-21') t1
LEFT JOIN orders ON t1.l_orderkey = orders.o_orderkey AND t1.l_shipdate = o_orderdate
GROUP BY
    t1.l_shipdate,
    o_orderdate,
    t1.l_partkey,
    t1.l_suppkey;
```

:::caution 注意
目前支持分区补偿，暂不支持带条件的 `UNION ALL` 补偿。

例如，如果物化视图带 `WHERE` 条件，构建过滤条件加上 `WHERE l_shipdate > '2023-10-19'`，而查询是 `WHERE l_shipdate > '2023-10-18'`，目前这种情况无法通过 `UNION ALL` 补偿，待支持。
:::

:::info 备注
自 3.1.0 版本起，分区补偿改写功能支持以下类型的分区表：内表、Hive、Iceberg 与 Paimon。仅当分区物化视图基于上述类型的分区表构建时，才能触发分区补偿改写机制。
:::

#### 2.2.8 嵌套物化视图改写

**定义**：物化视图的定义 SQL 可以使用物化视图，称为嵌套物化视图。嵌套层数理论上无限制，既可直查，也可参与透明改写。

**适用场景**：常用于数据建模和复杂查询。如果单独构建一个物化视图无法透明改写，可拆分复杂查询、构建嵌套物化视图。

**示例**：

创建内层物化视图 `mv8_0_inner_mv`：

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

创建外层物化视图 `mv8_0`：

```sql
CREATE MATERIALIZED VIEW mv8_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey,
    ps_availqty
FROM mv8_0_inner_mv
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```

对于以下查询，`mv8_0_inner_mv` 和 `mv8_0` 都会成功改写，最终代价模型会选择 `mv8_0`：

```sql
SELECT lineitem.l_linenumber
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey
WHERE o_orderstatus = 'o';
```

:::caution 注意
- 嵌套物化视图的层数越多，透明改写的耗时会相应增加。建议嵌套层数不超过 3 层。
- 嵌套物化视图透明改写默认关闭，开启方式见 [3.10 相关配置](#310-相关配置)。
:::

#### 2.2.9 聚合查询命中非聚合物化视图

如果查询是聚合查询、物化视图不含聚合，但物化视图能提供查询使用的所有列，也可改写。例如，查询先进行 JOIN 连接再 `GROUP BY` 聚合，命中包含 JOIN 连接的物化视图，是有收益的。

```sql
CREATE MATERIALIZED VIEW mv10_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, o_totalprice
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate;
```

下面查询可命中 `mv10_0`，节省了 `lineitem JOIN orders` 连接计算：

```sql
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

#### 2.2.10 窗口函数改写

当查询和物化视图都包含窗口函数，且窗口函数定义完全匹配时，可透明改写。窗口函数改写能复用物化视图中预计算的窗口函数结果，显著提升包含复杂窗口计算的查询性能。**目前支持所有窗口函数的透明改写。**

**示例一**：

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT *
FROM (
    SELECT
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
    FROM orders
) t
WHERE o_orderkey > 1;
```

下面查询可命中 `mv11_0`，节省窗口函数计算。即使查询条件 `o_orderkey > 2` 与物化视图不一致，也可改写成功：

```sql
SELECT *
FROM (
    SELECT
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
    FROM orders
) t
WHERE o_orderkey > 2;
```

**示例二**：

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
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
FROM orders
WHERE o_orderdate > '2023-12-09';
```

下面查询可命中 `mv11_1`，节省窗口函数计算。`o_orderdate` 属于窗口函数的 `PARTITION BY` 字段，虽然查询条件 `o_orderdate > '2023-12-10'` 早于窗口函数执行，也可透明改写：

```sql
SELECT
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
FROM orders
WHERE o_orderdate > '2023-12-10';
```

:::tip 提示
用例中使用的是单表，多表 JOIN 场景下窗口函数改写同样适用。
:::

#### 2.2.11 Limit 和 TopN 改写

当查询包含 `ORDER BY` 或 `LIMIT` 子句（即 Top-N 查询）时，如果物化视图能提供足够数据满足查询的 `ORDER BY` 和 `LIMIT` 要求，优化器可利用物化视图进行透明改写，显著加速常见的 Top-N 分析场景。

**改写条件**：

| 校验项     | 校验规则                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORDER BY   | 查询的 `ORDER BY` 子句必须与物化视图的 `ORDER BY` 子句兼容或完全相同。                                                                                     |
| LIMIT      | 物化视图无 `LIMIT` 时，任何带 `LIMIT` 的查询都可尝试改写。<br/>物化视图有 `LIMIT N` 时，查询的 `LIMIT M` 必须满足 `M <= N`。<br/>物化视图有 `LIMIT N OFFSET L` 时，查询的 `LIMIT M OFFSET O` 必须满足 `O >= L` 且 `M + O <= N + L`。 |
| WHERE 条件 | 物化视图和查询的其他 `WHERE` 条件应该相同。                                                                                                                |

**示例一**：

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 8 OFFSET 1;
```

下面查询可命中 `mv11_0`，满足校验条件：

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

下面查询不能命中 `mv11_0`，因为多了 `o_orderdate > '2023-12-08'` 条件。如果 `mv11_0` 物化视图也有此 `WHERE` 条件，则可命中：

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

**示例二**：

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey,
    o_orderkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 4 OFFSET 2;
```

下面查询中的 `ORDER BY + LIMIT` 会转化为 TopN，可命中 `mv11_1`，满足校验条件：

```sql
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 2 OFFSET 3;
```

### 2.3 查看透明改写情况（Explain）

<!-- 知识类型：故障排查 -->
<!-- 适用场景：调试查询为何未命中物化视图 -->

#### 2.3.1 简要查看：EXPLAIN

查看物化视图透明改写的简要过程信息：

```sql
EXPLAIN <query_sql>
```

返回信息（截取与物化视图相关部分）：

```text
| MaterializedView                                                              |
| MaterializedViewRewriteSuccessAndChose:                                       |
|   Names: mv5                                                                  |
| MaterializedViewRewriteSuccessButNotChose:                                    |
|                                                                               |
| MaterializedViewRewriteFail:                                                  |
|   Name: mv4                                                                   |
|   FailSummary: Match mode is invalid, View struct info is invalid             |
|   Name: mv3                                                                   |
|   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid |
|   Name: mv1                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
|   Name: mv2                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
```

字段含义：

- **`MaterializedViewRewriteSuccessAndChose`**：透明改写成功并被 CBO（Cost-Based Optimizer）选中的物化视图名称列表。
- **`MaterializedViewRewriteSuccessButNotChose`**：透明改写成功但最终未被 CBO 选中的物化视图名称列表。
- **`MaterializedViewRewriteFail`**：透明改写失败的物化视图及原因摘要。

#### 2.3.2 详细查看：EXPLAIN MEMO PLAN

如需了解物化视图的候选、改写以及最终选择的详细过程：

```sql
EXPLAIN MEMO PLAN <query_sql>
```

---

## 3. 维护物化视图

<!-- 知识类型：操作手册 -->
<!-- 适用场景：物化视图日常运维管理 -->

### 3.1 权限说明

| 操作                          | 所需权限                  |
| ----------------------------- | ------------------------- |
| 删除物化视图                  | 物化视图的删除权限（与删除表相同）。 |
| 修改物化视图                  | 物化视图的修改权限（与修改表相同）。 |
| 暂停 / 恢复 / 取消 / 刷新物化视图 | 物化视图的创建权限。       |

### 3.2 修改物化视图

#### 3.2.1 修改物化视图属性

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
    "grace_period" = "10"
);
```

#### 3.2.2 物化视图原子替换（重命名）

先创建用于替换的新物化视图：

```sql
CREATE MATERIALIZED VIEW mv9_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

使用 `mv9_0` 替换 `mv7` 并删除 `mv7`：

```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```

### 3.3 删除物化视图

```sql
DROP MATERIALIZED VIEW mv_1;
```

详情参考 [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW)。

### 3.4 查看物化视图创建语句

```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

详情参考 [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW)。

### 3.5 暂停 / 启用 / 取消刷新

| 操作                  | 参考文档                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 暂停物化视图           | [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB) |
| 启用物化视图           | [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB) |
| 取消物化视图刷新任务   | [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK) |

### 3.6 查询物化视图信息

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G
```

返回结果示例：

```text
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

**关键字段说明**：

- **`SyncWithBaseTables`**：物化视图和基表数据是否一致。
    - 全量构建的物化视图：此字段为 `1` 表明可用于透明改写。
    - 分区增量物化视图：以分区粒度判断。即使部分分区不可用，只要查询的是有效分区，物化视图仍可用于透明改写。是否能透明改写主要看查询所用分区的 `SyncWithBaseTables` 字段：`1` 表示可用，`0` 表示不可用。
- **`JobName`**：物化视图构建 Job 的名称。每个物化视图有一个 Job，每次刷新会有一个新的 Task，Job 和 Task 是 1:n 的关系。
- **`State`**：变为 `SCHEMA_CHANGE` 代表基表 Schema 发生变化。此时物化视图不能用于透明改写（不影响直查），下次刷新成功后将恢复为 `NORMAL`。
- **`SchemaChangeDetail`**：表示 `SCHEMA_CHANGE` 发生的原因。
- **`RefreshState`**：物化视图最后一次任务刷新状态。如为 `FAIL`，可通过 `tasks()` 命令进一步定位失败原因（参见 [3.7 查询刷新任务 TASK 信息](#37-查询刷新任务-task-信息)）。

**透明改写状态**：

- **状态正常**：物化视图当前可用于透明改写。
- **状态不正常 / 不可用**：物化视图不能用于透明改写，但仍可直查。

详情参考 [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos)。

### 3.7 查询刷新任务 TASK 信息

每个物化视图有一个 Job，每次刷新会产生一个新的 Task，Job 和 Task 是 1:n 的关系。根据物化视图名称查看 Task 状态：

```sql
SELECT *
FROM tasks("type"="mv")
WHERE
    MvDatabaseName = 'mv_db_name' AND
    mvName = 'mv_name'
ORDER BY CreateTime DESC \G
```

返回结果示例：

```text
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

**关键字段说明**：

- **`NeedRefreshPartitions` / `CompletedPartitions`**：本次 Task 需刷新与已完成刷新的分区。
- **`Status`**：`FAILED` 代表运行失败，可通过 `ErrorMsg` 查看原因，或通过 `LastQueryId` 搜索 Doris 日志获取详细信息。目前任务失败会导致已有物化视图不可用，未来将改为：即使任务失败，已存在物化视图仍可用于透明改写。
- **`ErrorMsg`**：失败原因。
- **`RefreshMode`**：
    - `COMPLETE`：刷新了全部分区。
    - `PARTIAL`：刷新了部分分区。
    - `NOT_REFRESH`：不需要刷新任何分区。

:::info 备注
- 目前 Task 存储和展示数量默认为 100 个，可在 `fe.conf` 中通过 `max_persistence_task_count` 修改。超过此数量将丢弃旧 Task 记录；若值小于 1，则不进行持久化。修改配置后需重启 FE 才能生效。
- 如果物化视图创建时设置了 `grace_period` 属性，即使 `SyncWithBaseTables` 为 `false` 或 `0`，某些情况下仍可用于透明改写。
- `grace_period` 单位为秒，表示物化视图与基表数据允许的不一致时间。
    - 设置为 `0`：要求物化视图与基表数据完全一致才可透明改写。
    - 设置为 `10`：允许 10 秒延迟，10 秒内物化视图都可用于透明改写。
:::

详情参考 [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks)。

### 3.8 查询物化视图对应的 JOB

```sql
SELECT *
FROM jobs("type"="mv")
WHERE Name = "inner_mtmv_75043";
```

详情参考 [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs)。

### 3.9 查询物化视图分区信息

分区物化视图通过 `SHOW PARTITIONS` 查看 `SyncWithBaseTables` 状态：

```sql
SHOW PARTITIONS FROM mv_name;
```

返回结果示例：

```Plain
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

主要查看 `SyncWithBaseTables` 字段：`true` 表示可用于透明改写，`false` 表示此分区不可用于透明改写。

详情参考 [SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS)。

### 3.10 查看物化视图表结构

详情参考 [DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE)。

### 3.11 相关配置

<!-- 知识类型：参考文档 -->
<!-- 适用场景：调优物化视图透明改写行为 -->

#### 3.11.1 Session Variables 开关

| 开关                                                                           | 说明                                                                                                                              |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SET enable_nereids_planner = true;`                                           | 异步物化视图仅在新优化器下支持，透明改写未生效时需开启。                                                                          |
| `SET enable_materialized_view_rewrite = true;`                                 | 开启或关闭查询透明改写。自 2.1.5 版本起默认开启。                                                                                 |
| `SET materialized_view_rewrite_enable_contain_external_table = true;`          | 参与透明改写的物化视图是否允许包含外表，默认不允许。若物化视图定义 SQL 包含外表且希望参与透明改写，可开启此开关。                  |
| `SET materialized_view_rewrite_success_candidate_num = 3;`                     | 透明改写成功的结果集合中允许参与 CBO 候选的最大数量，默认 3。如果透明改写性能较慢，可调小此值。                                  |
| `SET enable_materialized_view_union_rewrite = true;`                           | 当分区物化视图不足以提供查询全部数据时，是否允许基表和物化视图 `UNION ALL` 响应查询，默认允许。如发现命中物化视图时数据错误可关闭。 |
| `SET enable_materialized_view_nest_rewrite = true;`                            | 是否允许嵌套改写，默认不允许。如果查询 SQL 复杂、需构建嵌套物化视图才能命中，则需打开。                                          |
| `SET materialized_view_relation_mapping_max_count = 8;`                        | 透明改写过程中 relation mapping 最大允许数量，超过则截取。relation mapping 通常由表自关联产生，数量为笛卡尔积（如 3 张表可能产生 8 种组合），默认 8。如发现透明改写时间长，可调低。 |
| `SET enable_dml_materialized_view_rewrite = true;`                             | DML 时是否开启基于结构信息的物化视图透明改写，默认开启。                                                                          |
| `SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;` | DML 时，当物化视图存在无法实时感知数据的外表时，是否开启基于结构信息的透明改写，默认关闭。                                       |

#### 3.11.2 fe.conf 配置

| 配置项                              | 说明                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `job_mtmv_task_consumer_thread_num` | 控制同时运行的物化视图刷新任务数量，默认 10，超过则任务进入 pending 状态。修改后需重启 FE。 |
