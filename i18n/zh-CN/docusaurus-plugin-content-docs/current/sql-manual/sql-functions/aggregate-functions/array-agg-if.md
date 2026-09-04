---
{
    "title": "ARRAY_AGG_IF",
    "language": "zh-CN",
    "description": "将满足条件的行中的值串联成一个数组，可以用于多行转一行（行转列）的条件过滤。"
}
---

## 描述

对于满足条件的行，将其一列中的值（包括空值 null）串联成一个数组。条件为 false 或 null 的行会被整体跳过（不贡献元素，也不贡献 null）。

## 语法

```sql
ARRAY_AGG_IF(<cond>, <col>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<cond>` | BOOLEAN 类型表达式，决定该行是否被收集。条件为 false 或 null 时该行被跳过。 |
| `<col>` | 确定要放入数组的值的表达式，支持类型为 Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，TimestampNs，Timestamptz，IPV4，IPV6，String，Array，Map，Struct。|

## 返回值

返回 ARRAY 类型的值，特殊情况：

- 数组中元素不保证顺序。
- 保留 null 元素：当条件为 true 时，`<col>` 的 null 值仍会成为结果数组中的一个 null 元素。
- 没有任何行满足条件时，返回空数组。

## 举例

```sql
-- setup
CREATE TABLE test_doris_array_agg_if (
	c1 INT,
	c2 INT
) DISTRIBUTED BY HASH(c1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_doris_array_agg_if VALUES (1, 10), (1, 20), (1, 30), (2, 100), (2, 200), (3, NULL);
```

```sql
-- 每组收集大于 15 的值；c1=3 的行条件为 null，被跳过
select c1, array_agg_if(c2 > 15, c2) from test_doris_array_agg_if group by c1;
```

```text
+------+------------------------+
| c1   | array_agg_if(c2 > 15, c2) |
+------+------------------------+
|    1 | [20, 30]               |
|    2 | [100, 200]             |
|    3 | []                     |
+------+------------------------+
```

```sql
-- 行满足条件时，null 元素被保留
select c1, array_agg_if(c1 > 0, c2) from test_doris_array_agg_if group by c1;
```

```text
+------+----------------------+
| c1   | array_agg_if(c1 > 0, c2) |
+------+----------------------+
|    1 | [10, 20, 30]         |
|    2 | [100, 200]           |
|    3 | [null]               |
+------+----------------------+
```
