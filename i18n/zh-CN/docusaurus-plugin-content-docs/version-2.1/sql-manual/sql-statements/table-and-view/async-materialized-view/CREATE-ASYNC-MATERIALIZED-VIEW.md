---
{
    "title": "CREATE ASYNC MATERIALIZED VIEW",
    "language": "zh-CN",
    "description": "创建异步物化视图语句，列名和列类型是通过物化视图 SQL 语句推导出来的，可以自定义列名，不可以定义列类型。"
}
---

## 描述

创建异步物化视图语句，列名和列类型是通过物化视图 SQL 语句推导出来的，可以自定义列名，不可以定义列类型。

## 语法

```sql
CREATE MATERIALIZED VIEW 
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ] 
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [<refresh_trigger>]]
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

其中：

```sql
columns_definition
: -- Column definition
    <col_name> 
      [ COMMENT '<col_comment>' ]
refresh_trigger
  : ON MANUAL
  | ON SCHEDULE EVERY <int_value> <refresh_unit> [ STARTS '<start_time>']
  | ON COMMIT
```

## 必选参数

**1. `<materialized_view_name>`**

> 指定表的标识符（即名称）；在创建表的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**2. `<query>`**

> 在创建物化视图 中为必选参数。指定填充数据的 SELECT 语句。

## 可选参数

**1. `<key_cols>`**

> 表的 key 列。Doris 中 Key 列必须是表的前 K 个列。关于 Key 的限制，以及如何选择 Key 列，请参阅“数据模型”章节中的各个小节。

**2. `<build_mode>`**

> 刷新时机：物化视图创建完成是否立即刷新
>
> IMMEDIATE：立即刷新，默认 IMMEDIATE
>
> DEFERRED：延迟刷新

**3. `<refresh_method>`**

> 刷新方式
>
> COMPLETE：无论分区数据是否有变更，强制刷新所有分区
>
> AUTO：尽量增量刷新，只刷新自上次物化刷新后数据变化的分区，如果是分区物化视图建议用此刷新方式

:::caution 注意
如果是分区物化视图，刷新方式使用 COMPLETE，物化视图会全量刷新所有分区数据，退化成全量物化视图。

:::

**4.` <refresh_trigger>`**

> 触发方式
>
> MANUAL：手动刷新
>
> ON SCHEDULE：定时刷新
>
> ON COMMIT：触发式刷新，基表数据变更，触发物化视图刷新

**5. `<refresh_unit>`**

> 周期刷新时间单位，目前支持 MINUTE，HOUR，DAY，WEEK

**6. `<partition_col>`**

> 如果不指定 PARTITION BY，默认只有一个分区。
>
> 如果指定分区字段，会自动推导出字段来自哪个基表并同步基表（当前支持内表和 Hive 表），如果是内表，只允许有一个分区字段。
>
> 物化视图也可以通过分区上卷的方式减少物化视图的分区数量，目前分区上卷函数支持 `date_trunc`

**7. `<partition_unit>`**

> 分区上卷的聚合粒度，目前支持 HOUR，DAY，WEEK，QUARTER，MONTH，YEAR

**8. `<start_time>`**

> 调度开始时间需要比当前时间大，需要是未来的某个时间

**9. `<table_property>`**

:::caution 注意
`DISTRIBUTED BY` 这个子句如果不写，在 Apache Doris 2.1.10 之前会报错，在 Apache Doris 2.1.10 及以后
如果不写，默认是 RANDOM 分布。

:::


内表使用的属性，物化视图基本都可以使用，还有一些是物化视图特有的属性，列举如下

| 属性名                           | 作用                                                         |
| :------------------------------- | :----------------------------------------------------------- |
| grace_period                     | 查询改写时允许物化视图数据的最大延迟时间（单位：秒）。如果分区 A 和基表的数据不一致，物化视图的分区 A 上次刷新时间为 10:15:00，系统当前时间为  10:15:08，那么该分区不会被透明改写。但是如果 `grace_period`  = 10，该分区就会被用于透明改写 |
| excluded_trigger_tables          | 数据刷新时忽略的表名，逗号分割。例如`table1,table2`          |
| refresh_partition_num            | 单次 insert 语句刷新的分区数量，默认为 1。物化视图刷新时会先计算要刷新的分区列表，然后根据该配置拆分成多个 Insert 语句顺序执行。遇到失败的 Insert 语句，整个任务将停止执行。物化视图保证单个 Insert 语句的事务性，失败的 Insert 语句不会影响到已经刷新成功的分区 |
| workload_group                   | 物化视图执行刷新任务时使用的 `workload_group` 名称。用来限制物化视图刷新数据使用的资源，避免影响到其它业务的运行。关于 `workload_group` 的创建及使用，可参考 [WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/admin-manual/workload-group.md) 文档。 |
| partition_sync_limit             | 当基表的分区字段为时间时，可以用此属性配置同步基表的分区范围，配合 `partition_sync_time_unit` 一起使用。例如设置为 2，`partition_sync_time_unit` 设置为 `MONTH`，代表仅同步基表近 2 个月的分区和数据。最小值为 `1`。随着时间的变化物化视图每次刷新时都会自动增删分区，例如物化视图现在有 2,3 两个月的数据，下个月的时候，会自动删除 2 月的数据，增加 4 月的数据。 |
| partition_sync_time_unit         | 分区刷新的时间单位，支持 DAY/MONTH/YEAR（默认DAY）           |
| partition_date_format            | 当基表的分区字段为字符串时，如果想使用 `partition_sync_limit`的能力，可以设置日期的格式，将按照 `partition_date_format`的设置解析分区时间 |
| enable_nondeterministic_function | 物化视图定义 SQL 是否允许包含 nondeterministic 函数，比如 current_date(), now(), random() 等，如果 是 true, 允许包含，否则不允许包含，默认不允许包含。 |
| use_for_rewrite                  | 标识此物化视图是否参与到透明改写中，如果为 false，不参与到透明改写，默认是 true。数据建模场景中，如果物化视图只是用于直查，物化视图可以设置此属性，从而不参与透明改写，提高查询响应速度。 |

:::caution 注意

在 Apache Doris 2.1.10 和 3.0.6 版本之前，excluded_trigger_tables 属性仅支持指定基础表名。自该版本起，该属性已支持指定包含 Catalog 和 Database 的全限定表名（例如：internal.db1.table1）。

:::


## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限   | 对象             | 说明                                           |
| :---------------- | :------------------------ | :------------------------------------------------------ |
| CREATE_PRIV       | 数据库        |                                                         |
| SELECT_PRIV       | 表 , 视图 | 需要拥有<query> 中被查询的表或者视图的 SELECT_PRIV 权限 |

## 注意事项

- 物化视图  DML, DDL 限制

  物化视图不支持修改列类型，新增，删除列等 schema change 操作，原因是列是通过物化视图定义 SQL 推导出来的。

  物化视图不支持手动 insert into 或者 insert overwrite 数据。

- 分区物化视图创建条件

  > 物化视图的 SQL 定义和分区字段需要满足如下条件，才可以进行分区增量更新：
  >
  > 1. 物化视图使用的 Base Table 中至少有一个是分区表。
  > 2. 物化视图使用的 Base Table 分区表，必须使用 List 或者 Range 分区策略。
  > 3. 物化视图定义 SQL 中 Partition By 分区列只能有一个分区字段。
  > 4. 物化视图的 SQL 中 Partition By 的分区列，要在 Select 后。
  > 5. 物化视图定义 SQL，如果使用了 Group By，分区列的字段一定要在 Group By 后。
  > 6. 物化视图定义 SQL，如果使用了 Window 函数，分区列的字段一定要在 Partition By 后。
  > 7. 数据变更应发生在分区表上，如果发生在非分区表，物化视图需要全量构建。
  > 8. 物化视图使用 Join 的 NULL 产生端的字段作为分区字段，不能分区增量更新，例如对于 LEFT OUTER JOIN 分区字段需要在左侧，在右侧则不行。

## 示例

1. 全量物化视图

    ```sql
    CREATE MATERIALIZED VIEW complete_mv (
    orderdate COMMENT '订单日期', 
    orderkey COMMENT '订单键', 
    partkey COMMENT '部件键'
    ) 
    BUILD IMMEDIATE 
    REFRESH AUTO 
    ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00' 
    DISTRIBUTED BY HASH (orderkey) BUCKETS 2 
    PROPERTIES 
    ("replication_num" = "1") 
    AS 
    SELECT 
    o_orderdate, 
    l_orderkey, 
    l_partkey 
    FROM 
    orders 
    LEFT JOIN lineitem ON l_orderkey = o_orderkey 
    LEFT JOIN partsupp ON ps_partkey = l_partkey 
    and l_suppkey = ps_suppkey;
    ```

2. 分区物化视图

   如下所示，如果指定分区字段，会自动推导出字段来自哪个基表并同步基表分区。基表按照天分区，分区字段是 o_orderdate，分区类型是 RANGE。物化视图按月分区，使用 DATE_TRUNC 函数对基表分区按月进行上卷。

    ```sql
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
    FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY
    )
    DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
    PROPERTIES (
    "replication_num" = "3"
    );
    ```

    ```sql
    CREATE MATERIALIZED VIEW partition_mv
    BUILD IMMEDIATE 
    REFRESH AUTO 
    ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00' 
    PARTITION BY (DATE_TRUNC(o_orderdate, 'MONTH'))
    DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2 
    PROPERTIES 
    ("replication_num" = "3") 
    AS 
    SELECT 
    o_orderdate, 
    l_orderkey, 
    l_partkey 
    FROM 
    orders 
    LEFT JOIN lineitem ON l_orderkey = o_orderkey 
    LEFT JOIN partsupp ON ps_partkey = l_partkey 
    and l_suppkey = ps_suppkey;
    ```

如下用例就不能创建分区物化视图，因为分区字段使用了非 date_trunc 函数，报错信息是

`because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)
`

```sql
    CREATE MATERIALIZED VIEW partition_mv_2
    BUILD IMMEDIATE 
    REFRESH AUTO 
    ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00' 
    PARTITION BY (DATE_TRUNC(min_orderdate, 'MONTH'))
    DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2 
    PROPERTIES 
    ("replication_num" = "3") 
    AS
    SELECT 
    min(o_orderdate) AS min_orderdate, 
    l_orderkey, 
    l_partkey 
    FROM 
    orders 
    LEFT JOIN lineitem ON l_orderkey = o_orderkey 
    LEFT JOIN partsupp ON ps_partkey = l_partkey 
    and l_suppkey = ps_suppkey
    GROUP BY 
    o_orderdate, 
    l_orderkey, 
    l_partkey;
```

3. 修改物化视图属性

   使用 ALTER MATERIALIZED VIEW 语句。例如：

    ```sql
    ALTER MATERIALIZED VIEW partition_mv
    SET (
        "grace_period" = "10",
        "excluded_trigger_tables" = "lineitem,partsupp"
    );
    ```

4. 修改物化视图刷新方式
   使用 ALTER MATERIALIZED VIEW 语句。例如：

    ```sql
    ALTER MATERIALIZED VIEW partition_mv REFRESH COMPLETE;
    ```
   再运行 `SHOW CREATE MATERIALIZED VIEW partition_mv;` 可以看到物化视图的刷新方式已经变成了 COMPLETE。
