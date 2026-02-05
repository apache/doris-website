---
{
    "title": "MAP_AGG",
    "language": "zh-CN",
    "description": "MAPAGG 函数用于根据多行数据中的键值对形成一个映射结构。"
}
---

## 描述

MAP_AGG 函数用于根据多行数据中的键值对形成一个映射结构。

## 语法

`MAP_AGG(<expr1>, <expr2>)`

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 用于指定作为键的表达式, 支持类型为Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，String。|
| `<expr2>` | 用于指定作为对应的值的表达式, 支持类型为Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，String。 |

## 返回值

返回映射后的 Map 类型的值。
如果组内不存在合法数据，则返回一个空 Map 。

## 举例

```sql
-- setup
CREATE TABLE nation (
    n_nationkey INT,
    n_name STRING,
    n_regionkey INT
) DISTRIBUTED BY HASH(n_nationkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO nation VALUES
    (0, 'ALGERIA', 0),
    (1, 'ARGENTINA', 1),
    (2, 'BRAZIL', 1),
    (3, 'CANADA', 1);
```

```sql
select `n_regionkey`, map_agg(`n_nationkey`, `n_name`) from `nation` group by `n_regionkey`;
```

```text
+-------------+-----------------------------------------+
| n_regionkey | map_agg(`n_nationkey`, `n_name`)        |
+-------------+-----------------------------------------+
|           0 | {0:"ALGERIA"}                           |
|           1 | {1:"ARGENTINA", 2:"BRAZIL", 3:"CANADA"} |
+-------------+-----------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation`;
```

```text
+------------------------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5)                 |
+------------------------------------------------------+
| {"ALGERIA":0, "ARGENTINA":1, "BRAZIL":2, "CANADA":3} |
+------------------------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation` where n_nationkey is null;
```

```text
+--------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5) |
+--------------------------------------+
| {}                                   |
+--------------------------------------+
```

