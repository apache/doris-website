---
{
    "title": "最佳实践",
    "language": "zh-CN",
    "description": "当满足以下条件时，建议创建分区物化视图："
}
---

## 异步物化视图使用原则
- **时效性考虑：** 异步物化视图通常用于对数据时效性要求不高的场景，一般是 T+1 的数据。如果时效性要求高，应考虑使用同步物化视图。

-  **加速效果与一致性考虑：** 在查询加速场景，创建物化视图时，DBA 应将常见查询 SQL 模式分组，尽量使组之间无重合。SQL 模式组划分越清晰，物化视图构建的质量越高。一个查询可能使用多个物化视图，同时一个物化视图也可能被多个查询使用。构建物化视图需要综合考虑命中物化视图的响应时间（加速效果）、构建成本、数据一致性要求等。

-  **物化视图定义与构建成本考虑：**
    
    - 物化视图定义和原查询越接近，查询加速效果越好，但物化的通用性和复用性越差，意味着构建成本越高。
    
    - 物化视图定义越通用（例如没有 WHERE 条件和更多聚合维度），查询加速效果较低，但物化的通用性和复用性越好，意味着构建成本越低。

:::caution 注意
- **物化视图数量控制：** 物化视图并非越多越好。物化视图构建和刷新需要资源。物化视图参与透明改写，CBO 代价模型选择最优物化视图需要时间。理论上，物化视图越多，透明改写的时间越长。

- **定期检查物化视图使用状态：** 如果未使用，应及时删除。

- **基表数据更新频率：** 如果物化视图的基表数据频繁更新，可能不太适合使用物化视图，因为这会导致物化视图频繁失效，不能用于透明改写（可直查）。如果需要使用此类物化视图进行透明改写，需要允许查询的数据有一定的时效延迟，并可以设定`grace_period`。具体见`grace_period`的适用介绍。
:::


## 物化视图刷新方式选择原则

当满足以下条件时，建议创建分区物化视图：

- 物化视图的基表数据量很大，并且基表是分区表。

- 物化视图使用的表除了分区表外，其他表不经常变化。

- 物化视图的定义 SQL 和分区字段满足分区推导的要求，即符合分区增量更新的要求。详细要求可参考：[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#可选参数)

- 物化视图分区数不多，分区过多会导致分区多物化视图构建时间会过长。

当物化视图的部分分区失效时，透明改写可以使用物化视图的有效分区 UNION ALL 基表返回数据。

如果不能构建分区物化视图，可以考虑选择全量刷新的物化视图。

## 分区物化视图常见使用方式

当物化视图的基表数据量很大，且基表是分区表时，如果物化视图的定义 SQL 和分区字段满足分区推导的要求，此种场景比较适合构建分区物化视图。分区推导的详细要求可参考 [CREATE-ASYNC-MATERIALIZED-VIEW ](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#可选参数)和[异步物化视图 FAQ 构建问题 12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12构建分区物化视图报错)。

物化视图的分区是跟随基表的分区映射创建的，一般和基表的分区是 1:1 或者 1:n 的关系。

- 如果基表的分区发生数据变更，如新增分区、删除分区等情况，物化视图对应的分区也会失效。失效的分区不能用于透明改写，但可以直查。透明改写时发现物化视图的分区数据失效，失效的分区会通过联合基表来响应查询。

    确认物化视图分区状态的命令详见查看物化视图状态，主要是`show partitions from mv_name`命令。

- 如果物化视图引用的非分区表发生数据变更，会触发物化视图所有分区失效，导致此物化视图不能用于透明改写。需要刷新物化视图所有分区的数据，命令为`REFRESH MATERIALIZED VIEW mv1 AUTO;`。此命令会尝试刷新物化视图所有数据变化的分区。

    因此，一般将数据频繁变化的表放在分区物化视图引用的分区表，将不经常变化的维表放在非引用分区表的位置。
- 如果物化视图引用的非分区表发生数据变更，非分区表数据只是新增，不涉及修改，创建物化视图的时候可以指定属性 
`excluded_trigger_tables = '非分区表名1,非分区表名2'`，这样非分区表的数据变化就不会使物化视图的所有分区失效，下次刷新时，只刷新分区表对应的物化视图失效分区。

分区物化视图的透明改写是分区粒度的，即使物化视图的部分分区失效，此物化视图仍然可用于透明改写。但如果只查询了一个分区，并且物化视图这个分区数据失效了，那么此物化视图不能用于透明改写。

例如：

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
  )
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES      
(1, 2, 3, 4, '2024-05-01 01:45:05', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-05-01', '2024-05-01', '2024-05-01', 'a', 'b', 'yyyyyyyyy'),    
(1, 2, 3, 4, '2024-05-15 02:35:05', 5.5, 6.5, 0.15, 8.5, 'o', 'k', '2024-05-15', '2024-05-15', '2024-05-15', 'a', 'b', 'yyyyyyyyy'),     
(2, 2, 3, 5, '2024-05-25 08:30:06', 5.5, 6.5, 0.2, 8.5, 'o', 'k', '2024-05-25', '2024-05-25', '2024-05-25', 'a', 'b', 'yyyyyyyyy'),     
(3, 4, 3, 6, '2024-06-02 09:25:07', 5.5, 6.5, 0.3, 8.5, 'o', 'k', '2024-06-02', '2024-06-02', '2024-06-02', 'a', 'b', 'yyyyyyyyy'),

CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL, 
    ps_suppkey INTEGER NOT NULL, 
    ps_availqty INTEGER NOT NULL, 
    ps_supplycost DECIMALV3(15, 2) NOT NULL, 
    ps_comment VARCHAR(199) NOT NULL
  )
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES     
(2, 3, 9, 10.01, 'supply1'),     
(4, 3, 9, 10.01, 'supply2'),     
(5, 6, 9, 10.01, 'supply3'),     
(6, 5, 10, 11.01, 'supply4');
```

在这个例子中，`orders`表的`o_ordertime`字段是分区字段，类型是`DATETIME`，按照天分区。

查询主要是按照"天"的粒度

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

为了不让物化视图每次刷新的分区数量过多，物化视图的分区粒度可以和基表`orders`一致，也按"天"分区。

物化视图的定义 SQL 的粒度可以按照"天"，并且按照"天"来聚合数据，

```sql
CREATE MATERIALIZED VIEW rollup_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
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

## 分区物化视图只保留最近分区数据

:::tip 提示
自 Apache Doris 2.1.1 版本起支持此功能。
:::

物化视图可以只保留最近几个分区的数据，每次刷新时，自动删除过期的分区数据。
可以通过设置物化视图的属性 `partition_sync_limit`，`partition_sync_time_unit`，`partition_sync_date_format` 来实现。

partition_sync_limit： 基表的分区字段为时间时，可以用此属性配置同步基表的分区范围，配合 partition_sync_time_unit 一起使用。例如设置为 3，
partition_sync_time_unit 设置为 DAY，代表仅同步基表近 3 天的分区和数据。

partition_sync_time_unit： 分区刷新的时间单位，支持 DAY/MONTH/YEAR（默认DAY）。

partition_date_format：当基表的分区字段为字符串时，如果想使用 partition_sync_limit的能力，可以设置日期的格式。

例如：
物化视图定义如下，物化视图只保留最近 3 天的数据，如果最近 3 天没有数据，直查如下物化视图，就不会返回数据。
```sql
CREATE MATERIALIZED VIEW latest_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
PROPERTIES (
  "partition_sync_limit" = "3", 
  "partition_sync_time_unit" = "DAY", 
  "partition_date_format" = "yyyy-MM-dd"
)       
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

## 如何使用物化视图加速查询

使用物化视图查询加速，首先需要查看 profile 文件，找到一个查询消耗时间最多的操作，一般出现在连接（Join）、聚合（Aggregate）、过滤（Filter）或者表达式计算（Calculated Expressions）。

对于 Join、Aggregate、Filters、Calculated Expressions，构建物化视图都能起到加速查询的作用。如果一个查询中 Join 占用了大量的计算资源，而 Aggregate 相对而言占用较小的资源，则可以针对 Join 构建物化视图。

接下来，将详细说明如何针对上述四种操作构建物化视图：

1. **对于 Join**
    
    可以提取查询中使用的公共的表连接模式来构建物化视图。透明改写如果使用了此物化视图，可以节省 Join 连接的计算。将查询中的 Filters 去除，这样就是一个比较通用的 Join 物化视图。
    
2. **对于 Aggregate**
    
    建议尽量使用低基数的字段作为维度来构建物化视图。如果维度相关，那么聚合后的数量可以尽量减少。
    
    比如表 t1，原表的数据量是 1000000，查询语句 SQL 中有 `group by a, b, c`。如果 a，b，c 的基数分别是 100，50，15，那么聚合后的数据大概在 75000 左右，说明此物化视图是有效的。如果 a，b，c 具有相关性，那么聚合后的数据量会进一步减少。
    
    如果 a, b, c 的基数很高，会导致聚合后的数据急速膨胀。如果聚合后的数据比原表的数据还多，可能这样的场景不太适合构建物化视图。比如 c 的基数是 3500，那么聚合后的数据量在 17000000 左右，比原表数据量大的多，构建这样的物化视图性能加速收益低。
    
    物化视图的聚合粒度要比查询细，即物化视图的聚合维度包含查询的聚合维度，这样才能提供查询所需的数据。查询可以不写 Group By，同理，物化视图的聚合函数应该包含查询的聚合函数。

3. **对于 Filter**
    
    如果查询中经常出现对相同字段的过滤，那么通过在物化视图中添加相应的 Filter，可以减少物化视图中的数据量，从而提高查询时命中物化视图的性能。
    
    要注意的是，物化视图应该比查询中出现的 Filter 少，查询的 Filter 要包含物化的 Filter。比如查询是 `a > 10 and b > 5`，物化视图可以没有 Filter，如果有 Filter 的话应对 a 和 b 过滤，并且数据范围要求比查询大，例如物化视图可以是 `a > 5 and b > 5`，也可以是 `a > 5` 等。

4. **对于 Calculated Expressions**
    
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
    
    根据以上两个 SQL 查询，我们可以构建一个更为通用的包含 Aggregate 的物化视图。在这个物化视图中，我们将 l_partkey 和 l_suppkey 都作为聚合的 group by 
    维度，并将 o_orderdate 作为过滤条件。值得注意的是，o_orderdate 不仅在物化视图的条件补偿中使用，
    同时也需要被包含在物化视图的聚合 group by 维度中。
    
    通过这种方式构建的物化视图后，查询 1 和查询 2 都可以命中该物化视图，物化视图定义如下：
        
    ```sql
    CREATE MATERIALIZED VIEW common_agg_mv
    BUILD IMMEDIATE REFRESH AUTO ON MANUAL
    DISTRIBUTED BY RANDOM BUCKETS 2
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

### 场景一：查询加速

在 BI 报表场景或其他加速场景中，用户对于查询响应时间较为敏感，通常要求能够秒级别返回结果。而查询通常涉及多张表先进行 Join 计算、再聚合计算，
该过程会消耗大量计算资源，并且有时难以保证时效性。对此，异步物化视图能够很好应对，它不仅支持直接查询，也支持透明改写，
优化器会依据改写算法和代价模型，自动选择最优的物化视图来响应请求。

#### 用例 1 多表连接聚合查询加速
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

#### 用例 2 日志查询加速

在日志查询加速场景中，建议不局限于单独使用异步物化视图，可以结合同步物化视图。

一般基表是分区表，按照小时分区居多，单表聚合查询，一般过滤条件是按照时间，还有一些标识位。有时查询的响应速度无法达到要求，一般可以构建异步物化视图进行加速。

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
BUCKETS 3;
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

### 场景二：数据建模（ETL）

数据分析工作往往需要对多表进行连接和聚合，这一过程通常涉及复杂且频繁重复的查询。
这类查询可能引发查询延迟高或资源消耗大的问题。然而，如果采用异步物化视图构建数据分层模型，则可以很好避免该问题，
利用创建好的物化视图创建更高层级的物化视图（2.1.3 支持），灵活满足不同的需求。

不同层级的物化视图可以设置各自的触发方式，例如：

- 第一层的物化视图可以设置为定时刷新，第二层的设置为触发刷新。这样，第一层的物化视图刷新完成后，会自动触发第二层物化视图的刷新。
- 如果每层的物化视图都设置为定时刷新，那么第二层物化视图刷新的时候，不会考虑第一层的物化视图数据是否和基表同步，只会把第一层物化视图的数据加工后同步到第二层。

接下来，通过 TPC-H 数据集说明异步物化视图在数据建模中的应用，以分析每月各地区和国家的订单数量和利润为例：

原始查询（未使用物化视图）：
```sql
SELECT
n_name,
date_trunc(o.o_orderdate, 'month') as month,
count(distinct o.o_orderkey) as order_count,
sum(l.l_extendedprice * (1 - l.l_discount)) as revenue
FROM orders o
JOIN lineitem l ON o.o_orderkey = l.l_orderkey
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
GROUP BY n_name, month;
```

使用异步物化视图分层建模：

构建 DWD 层（明细数据），处理订单明细宽表
```sql
CREATE MATERIALIZED VIEW dwd_order_detail
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
select
o.o_orderkey,
o.o_custkey,
o.o_orderstatus,
o.o_totalprice,
o.o_orderdate,
c.c_name,
c.c_nationkey,
n.n_name as nation_name,
r.r_name as region_name,
l.l_partkey,
l.l_quantity,
l.l_extendedprice,
l.l_discount,
l.l_tax
from orders o
join customer c on o.o_custkey = c.c_custkey
join nation n on c.c_nationkey = n.n_nationkey
join region r on n.n_regionkey = r.r_regionkey
join lineitem l on o.o_orderkey = l.l_orderkey;
```

构建 DWS 层（汇总数据），进行每日订单汇总
```sql
CREATE MATERIALIZED VIEW dws_daily_sales
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
select
date_trunc(o_orderdate, 'month') as month,
nation_name,
region_name,
bitmap_union(to_bitmap(o_orderkey)) as order_count,
sum(l_extendedprice * (1 - l_discount)) as net_revenue
from dwd_order_detail
group by
date_trunc(o_orderdate, 'month'),
nation_name,
region_name;
```


使用物化视图优化查询如下：
```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) as revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```



### 场景三：湖仓一体联邦数据查询

在现代化的数据架构中，企业通常会采用湖仓一体设计，以平衡数据的存储成本与查询性能。在这种架构下，经常会遇到两个关键挑战：
- 查询性能受限：频繁查询数据湖中的数据时，可能会受到网络延迟和第三方服务的影响，从而导致查询延迟，进而影响用户体验。
- 数据分层建模的复杂性：在数据湖到实时数仓的数据流转和转换过程中，通常需要复杂的 ETL 流程，这增加了维护成本和开发难度。
  
使用 Doris 异步物化视图，可以很好的应对上述挑战：
- 透明改写加速查询：将常用的数据湖查询结果物化到 Doris 内部存储，采用透明改写可有效提升查询性能。
- 简化分层建模：支持基于数据湖中的表创建物化视图，实现从数据湖到实时数仓的便捷转换，极大简化了数据建模流程。

如下，以 Hive 示例说明：

基于 Hive 创建 Catalog，使用 TPC-H 数据集
```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store 地址
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```

基于 Hive Catalog 创建物化视图
```sql
-- 物化视图只能在 internal 的 catalog 上创建，切换到内部 catalog
switch internal;
create database hive_mv_db;
use hive_mv_db;

CREATE MATERIALIZED VIEW external_hive_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 12
AS
SELECT
n_name,
o_orderdate,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
GROUP BY
n_name,
o_orderdate;
```

运行如下的查询，通过透明改写自动使用物化视图加速查询。
```sql
SELECT
n_name,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
AND o_orderdate >= DATE '1994-01-01'
AND o_orderdate < DATE '1994-01-01' + INTERVAL '1' YEAR
GROUP BY
n_name
ORDER BY
revenue DESC;
```

:::tip 提示
Doris 暂无法感知除 Hive 外的其他外表数据变更。当外表数据不一致时，使用物化视图可能出现数据不一致的情况。以下开关表示：参与透明改写的物化视图是否允许包含外表，默认 false。如接受数据不一致或者通过定时刷新来保证外表数据一致性，可以将此开关设置成 true。
设置包含外表的物化视图是否可用于透明改写，默认不允许，如果可以接受数据不一致或者可以自行保证数据一致，可以开启

`SET materialized_view_rewrite_enable_contain_external_table = true;`

如果物化视图在 MaterializedViewRewriteSuccessButNotChose 状态，说明改写成功但 plan 未被 CBO 选择，可能是因为外表的统计信息不完整。
启用统计信息从文件中获取行数 

``SET enable_get_row_count_from_file_list = true;``
   
查看外表统计信息，确认是否已收集完整 

``SHOW TABLE STATS external_table_name;``

:::


### 场景四：提升写入效率，减少资源竞争
在高吞吐的数据写入的场景中，系统性能的稳定性与数据处理的高效性同样重要。通过异步物化视图灵活的刷新策略，用户可以根据具体场景选择合适的刷新方式，从而降低写入压力，避免资源争抢。

相比之下，异步物化视图提供了手动触发、触发式、周期性触发三种灵活的刷新策略。用户可以根据场景需求差异，选择合适的刷新策略。当基表数据变更时，不会立即触发物化视图刷新，延迟刷新有利于降低资源压力，有效避免写入资源争抢。

如下所示，选择的刷新方式为定时刷新，每 2 小时刷新一次。当 orders 和 lineitem 导入数据时，不会立即触发物化视图刷新。

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
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

透明改写能够对查询 SQL 的改写，实现了查询加速，同时也能对导入 SQL 进行改写，从而提升导入效率。
从 2.1.6 版本开始，当物化视图和基表数据强一致时，可对 DML 操作如 Insert Into 或者 Insert Overwrite 进行透明改写，这对于数据导入场景的性能提升有显著效果。

1. 创建 Insert Into 数据的目标表
```sql
CREATE TABLE IF NOT EXISTS target_table  (
orderdate      DATE NOT NULL,
shippriority   INTEGER NOT NULL,
linestatus     CHAR(1) NOT NULL,
sale           DECIMALV3(15,2) NOT NULL
)
DUPLICATE KEY(orderdate, shippriority)
DISTRIBUTED BY HASH(shippriority) BUCKETS 3;
```

2. common_schedule_join_mv
```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
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

未经改写的导入语句如下：
```sql
INSERT INTO target_table
SELECT
o_orderdate,
o_shippriority,
l_linestatus,
l_extendedprice * (1 - l_discount)
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

经过透明改写后，语句如下：

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```

需要注意的是：如果 DML 操作的是无法感知数据变更的外表，透明改写可能导致基表最新数据无法实时导入目标表。如果用户可以接受数据不一致或能够自行保证数据一致性，可以打开如下开关

DML 时，当物化视图存在无法实时感知数据的外表时，是否开启基于结构信息的物化视图透明改写，默认关闭

`SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;`