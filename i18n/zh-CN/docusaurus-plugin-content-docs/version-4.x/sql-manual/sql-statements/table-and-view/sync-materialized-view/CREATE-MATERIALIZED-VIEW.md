---
{
    "title": "CREATE SYNC MATERIALIZED VIEW",
    "language": "zh-CN",
    "description": "创建同步物化视图语句"
}
---

## 描述

创建同步物化视图语句

## 语法

```sql
CREATE MATERIALIZED VIEW <materialized_view_name> AS <query>            
```

其中

```sql
query
    :
    SELECT <select_expr> select_expr[, select_expr ...]
    FROM <base_table>
    WHERE condition
    GROUP BY <column_name>[, <column_name> ...]
    ORDER BY <column_name>[, <column_name> ...]
```

## 必选参数

**1. `<materialized_view_name>`**

> 指定表的标识符（即名称）；同步物化视图基于表创建，所以名称需要在相同表中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**2. `<query>`**

> 用于构建物化视图的查询语句，查询语句的结果既物化视图的数据。目前支持的 query 格式为：
>
> 语法和查询语句语法一致。
>
> - `select_expr`：物化视图的 schema 中所有的列。
>   - 至少包含一个单列。
> - `base_table`：物化视图的原始表名，必填项。
>   - 必须是单表，且非子查询
> - `where`：物化视图的过滤条件，选填项。
>   - 不填则数据不进行过滤。
> - `group by`：物化视图的分组列，选填项。
>   - 不填则数据不进行分组。
> - `order by`：物化视图的排序列，选填项。
>   - 排序列的声明顺序必须和 select_expr 中列声明顺序一致。
>   - 如果不声明 order by，则根据规则自动补充排序列。如果物化视图是聚合类型，则所有的分组列自动补充为排序列。如果物化视图是非聚合类型，则前 36 个字节自动补充为排序列。
>   - 如果自动补充的排序个数小于 3 个，则前三个作为排序列。如果 query 中包含分组列的话，则排序列必须和分组列一致。

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes）                              |
| :---------------- | :------------- | :----------------------------------------- |
| ALTER_PRIV        | 表（Table）    | 需要拥有当前物化视图基表的 ALTER_PRIV 权限 |

## 注意事项

- 同步物化视图select列表中的列名不能和基表中已有列相同，也不能和基表的所有其他同步物化视图中的列名重复，可以通过指定别名的方式(col as xxx)避免重名。
- 同步物化视图只支持针对单个表的 SELECT 语句，支持 WHERE、GROUP BY、ORDER BY 等子句，但不支持 JOIN、HAVING、LIMIT 子句和 LATERAL VIEW。
- SELECT 列表中，不能包含自增列，不能包含常量，不能有重复表达式，也不支持窗口函数。
- 如果 SELECT 列表包含聚合函数，则聚合函数必须是根表达式（不支持 `sum(a) + 1`，支持 `sum(a + 1)`），且聚合函数之后不能有其他非聚合函数表达式（例如，`SELECT x, sum(a)` 可以，而 `SELECT sum(a)`, x 不行）。
- 单表上过多的物化视图会影响导入的效率：导入数据时，物化视图和 Base 表的数据是同步更新的。如果一张表的物化视图表过多，可能会导致导入速度变慢，这就像单次导入需要同时导入多张表的数据一样。
- 物化视图针对 Unique Key 数据模型时，只能改变列的顺序，不能起到聚合的作用。因此，在 Unique Key 模型上不能通过创建物化视图的方式对数据进行粗粒度的聚合操作。
- 物化视图针对 Unique Key和Aggregate Key 数据模型时，如果指定了where条件，那where条件只能使用Key列，而不能使用Value列。

## 示例


```sql
desc lineitem;
```

```text
+-----------------+---------------+------+-------+---------+-------+
| Field           | Type          | Null | Key   | Default | Extra |
+-----------------+---------------+------+-------+---------+-------+
| l_orderkey      | int           | No   | true  | NULL    |       |
| l_partkey       | int           | No   | true  | NULL    |       |
| l_suppkey       | int           | No   | true  | NULL    |       |
| l_linenumber    | int           | No   | true  | NULL    |       |
| l_quantity      | decimal(15,2) | No   | false | NULL    | NONE  |
| l_extendedprice | decimal(15,2) | No   | false | NULL    | NONE  |
| l_discount      | decimal(15,2) | No   | false | NULL    | NONE  |
| l_tax           | decimal(15,2) | No   | false | NULL    | NONE  |
| l_returnflag    | char(1)       | No   | false | NULL    | NONE  |
| l_linestatus    | char(1)       | No   | false | NULL    | NONE  |
| l_shipdate      | date          | No   | false | NULL    | NONE  |
| l_commitdate    | date          | No   | false | NULL    | NONE  |
| l_receiptdate   | date          | No   | false | NULL    | NONE  |
| l_shipinstruct  | char(25)      | No   | false | NULL    | NONE  |
| l_shipmode      | char(10)      | No   | false | NULL    | NONE  |
| l_comment       | varchar(44)   | No   | false | NULL    | NONE  |
+-----------------+---------------+------+-------+---------+-------+
```

```sql
CREATE MATERIALIZED VIEW sync_agg_mv AS
SELECT 
  l_shipdate as shipdate,
  l_partkey as partkey,
  count(*),
  sum(l_discount)
FROM
  lineitem
GROUP BY
  l_shipdate,
  l_partkey;
```
