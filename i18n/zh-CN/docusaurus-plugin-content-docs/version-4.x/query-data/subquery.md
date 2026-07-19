---
{
    "title": "子查询",
    "language": "zh-CN",
    "description": "Doris 子查询（Subquery）使用指南：标量、非标量、关联与非关联子查询的语法、限制与 Mark Join 处理。",
    "keywords": [
        "Doris 子查询",
        "Subquery",
        "标量子查询",
        "关联子查询",
        "Correlated Subquery",
        "IN EXISTS 子查询",
        "Mark Join"
    ]
}
---

<!-- 知识类型: 能力定义 + 使用限制 -->
<!-- 适用场景: 编写嵌套 SQL 查询 / 排查子查询报错 -->

子查询（Subquery）是嵌套在另一个查询（通常是 SELECT 语句）中的 SQL 查询。它可以用在 SELECT、FROM、WHERE 或 HAVING 子句中，为外部查询提供数据或条件。借助子查询，可以在单个 SQL 中完成更复杂的过滤、聚合与关联逻辑。

本文介绍 Doris 中子查询的分类、支持范围、限制条件，以及在特殊场景下使用的 Mark Join 机制。

## 适用场景

子查询常用于以下场景：

- **复杂过滤**：在 `WHERE` 或 `HAVING` 子句中使用子查询动态计算过滤条件。
- **派生列计算**：在 `SELECT` 列表中通过标量子查询补充字段。
- **派生表（Derived Table）**：在 `FROM` 子句中将子查询作为一张临时表参与连接。
- **存在性判断**：使用 `EXISTS`/`NOT EXISTS`、`IN`/`NOT IN` 判断关联关系。

## 子查询的基本特征

在使用子查询时，需要注意以下几个基本特征：

| 特征 | 说明 |
| --- | --- |
| 出现位置 | 可出现在 `SELECT`、`FROM`、`WHERE`、`HAVING` 子句中，可与 `SELECT`、`UPDATE`、`INSERT`、`DELETE` 以及 `=`、`>`、`<`、`<=`、`IN`、`EXISTS` 等表达式运算符配合使用 |
| 主子关系 | 外层查询称为主查询，嵌套在内部的查询称为子查询 |
| 执行顺序 | 独立子查询通常先执行；存在关联性时，解析器会按需决定执行顺序，并将子查询结果反馈给主查询 |
| 语法约束 | 子查询必须使用括号包裹，以与主查询区分 |

下文示例统一使用 `t1` 与 `t2` 两张表，建表语句如下：

```sql
create table t1
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

## 子查询的分类

子查询可以从两个维度进行划分：**返回数据的特性**，以及**是否引用外部查询的列**。

### 按返回数据特性分类

按照子查询返回数据的特性，可分为标量子查询与非标量子查询。

| 类型 | 返回结果 | 空表时的返回值 | 可出现的位置 |
| --- | --- | --- | --- |
| 标量子查询 | 单一值（一行一列的 Relation） | `NULL` | 任何允许单值表达式出现的地方 |
| 非标量子查询 | 一个 Relation（可包含多行多列） | 空集（0 行） | 任何允许关系（集合）出现的地方 |

示例如下（当 `t2` 是空表时，两个子查询返回结果不同）：

```sql
-- 标量子查询，当 t2 是空表时，子查询返回标量值 null
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);

-- 非标量子查询，当 t2 是空表时，子查询返回 empty set (0 rows)
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### 按是否引用外部列分类

按照子查询是否引用了外部查询的列，可分为关联子查询与非关联子查询。

| 类型 | 是否引用外部列 | 执行方式 |
| --- | --- | --- |
| 非关联子查询 | 否 | 通常可独立运算，一次性返回结果供外部查询使用 |
| 关联子查询 | 是（常见于子查询的 `WHERE` 条件中） | 对外部表的每一行都需要执行一次子查询，相当于对外部表的过滤操作 |

示例如下：

```sql
-- 关联子查询，子查询内部使用了外部表的列 t1.c2
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);

-- 非关联子查询，子查询内部没有使用任何外部表 t1 的列
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

## Doris 支持的子查询

<!-- 知识类型: 能力支持矩阵 -->

Doris 支持所有非关联子查询，对关联子查询的支持范围如下：

- 支持 `WHERE` 和 `HAVING` 子句中的关联标量子查询。
- 支持 `WHERE` 和 `HAVING` 子句中关联的 `IN`、`NOT IN`、`EXISTS`、`NOT EXISTS` 非标量子查询。
- 支持 `SELECT` 列表中的关联标量子查询。
- 对于嵌套子查询，仅支持子查询关联到自己的直接父查询，不支持跨层级关联到更外层查询。

## 关联子查询的限制

<!-- 知识类型: 使用限制 -->
<!-- 适用场景: SQL 报错排查 / 改写关联子查询 -->

不同形态的关联子查询在 Doris 中有不同的限制，下面分别说明。

### 关联标量子查询的限制

需要同时满足以下两个条件：

- 关联条件必须是等值条件。
- 子查询的输出必须是单个聚合函数的结果，且没有 `group by` 子句。

```sql
-- 单个聚合函数，且无 group by，支持
select * from t1 where t1.c1 < (select max(t2.c1) from t2 where t1.c2 = t2.c2);

-- 等价改写的 SQL 如下：
select t1.* from t1 inner join (select t2.c2 as c2, max(t2.c1) as c1 from t2 group by t2.c2) tx on t1.c1 < tx.c1 and t1.c2 = tx.c2;

-- 非等值条件，不支持
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 > t2.c2);

-- 没有聚合函数，不支持
select * from t1 where t1.c1 = (select t2.c1 from t2 where t1.c2 = t2.c2);

-- 有聚合函数，但包含 group by，不支持
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 = t2.c2 group by t2.c2);
```

### 关联 (NOT) EXISTS 子查询的限制

- 子查询不能同时使用 `offset` 和 `limit`。

```sql
-- 带 limit 但无 offset，支持
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);

-- 等价改写 SQL 如下：
select * from t1 left semi join t2 on t1.c2 = t2.c2;

-- 带 offset 和 limit，不支持
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```

### 关联 (NOT) IN 子查询的限制

需要同时满足以下三个条件：

- 子查询的输出必须是单个列。
- 子查询不能带有 `limit`。
- 子查询不能带有聚合函数或 `group by` 子句。

```sql
-- 支持的子查询
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2);

-- 改写的等价 SQL 如下：
select * from t1 left semi join t2 on t1.c1 = t2.c1 and t1.c2 = t2.c2;

-- 子查询输出为多列，不支持
select * from t1 where (t1.a, t1.c) in (select t2.c1, t2.c from t2 where t1.c2 = t2.c2);

-- 子查询带 limit，不支持
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 limit 3);

-- 带有 group by 子句，不支持
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 group by t2.c1);

-- 带有聚合函数，不支持
select * from t1 where t1.c1 in (select sum(t2.c1) from t2 where t1.c2 = t2.c2);
```

### 嵌套子查询的限制

目前只支持子查询关联到自己直接的父查询，不支持关联到父查询的更外层查询。

假设还有一张 `t3` 表，建表语句如下：

```sql
create table t3
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

- 支持：子查询只引用了自己直接父查询的列。

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2
        ) and t2.c2 = t1.c2
    );
    ```

- 不支持：最内层子查询既使用了直接父查询的列 `t2.c2`，又使用了最外层查询的列 `t1.c1`。

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2 and t3.c1 = t1.c1
        )
    );
    ```

## Mark Join

<!-- 知识类型: 执行机制 -->
<!-- 适用场景: 子查询与其他过滤条件存在 OR 关系时 -->

在 `WHERE` 条件中，当 `(NOT) IN` 或 `(NOT) EXISTS` 的子查询与其他过滤条件构成 `OR` 关系时，需要特殊处理才能生成正确结果。例如：

```sql
select
    t1.c1,
    t1.c2
from t1
where exists (
    select
        t2.c1
    from t2
    where
        t1.c2 = t2.c2
    ) or t1.c1 > 0;
```

如果直接将上述 `EXISTS` 子句改写为 `LEFT SEMI JOIN`，根据其语义只会输出 `t1` 中满足 `t1.c2 = t2.c2` 的行；而实际上满足 `t1.c1 > 0` 的行也应该被输出。为此，Doris 引入了 **Mark Join** 机制。

:::info 备注
`RIGHT SEMI JOIN` 类似，只是左右表不同。这里以 `LEFT SEMI JOIN` 为例进行说明。
:::

示例 SQL 如下：

```sql
-- 此 SQL 不能实际执行，只作为演示使用
select
    tx.c1,
    tx.c2
from
    (
        select
            t1.c1,
            t1.c2,
            mark_join_flag
        from
            t1 left (mark) semi join t2 on t1.c2 = t2.c2
    ) tx
where
    tx.mark_join_flag or tx.c1 > 0;
```

Mark Join 与普通 `LEFT SEMI JOIN` 的区别在于：普通 `LEFT SEMI JOIN` 会直接输出左表满足条件的行；而 Mark Join 会输出原始的左表，并额外附加一个值为 `TRUE`、`FALSE` 或 `NULL` 的标志位列（示例中的 `mark_join_flag`）。该标志位的值由 `JOIN` 条件表达式 `t1.c2 = t2.c2` 决定，每一行都对应一个标志位值，对照关系如下：

| t1.c2 | t2.c2 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

有了该标志位之后，原 `WHERE` 过滤条件可改写为 `where mark_join_flag or t1.c1 > 0`，从而得到正确结果。

## 常见问题

<!-- 知识类型: Troubleshooting -->
<!-- 适用场景: 标量子查询运行时报错排查 -->

由于标量子查询的输出必须是一个单值，如果子查询返回的数据量超过一条记录，将会报告运行时错误。

### 关联标量子查询返回多行报错

在使用关联标量子查询时，如果对于外部某一行，满足关联条件的子查询返回的数据多于一条，将会触发运行时错误。

```sql
-- 关联的标量子查询，如果 t2 表中满足 t1.c2 = t2.c2 的数据多于 1 条，则会报运行时错误
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;

-- 报错信息样例如下
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] correlate scalar subquery must return only 1 row
```

### 非关联标量子查询返回多行报错

Doris 会在运行时添加一个 `assert num rows` 算子，如果子查询返回的数据量超过一条记录，将会触发运行时错误。

```sql
-- 非关联的标量子查询，如果 t2 表有多于 1 条的数据，则可能报运行时错误
select t1.*, (select t2.c1 from t2) from t1;

-- 报错信息样例如下
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```
