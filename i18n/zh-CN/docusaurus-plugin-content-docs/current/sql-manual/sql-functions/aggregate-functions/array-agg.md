---
{
    "title": "ARRAY_AGG",
    "language": "zh-CN",
    "description": "将一列中的值（包括空值 null）串联成一个数组，可以用于多行转一行（行转列）。"
}
---

## 描述

将一列中的值（包括空值 null）串联成一个数组，可以用于多行转一行（行转列）。

## 语法

```sql
ARRAY_AGG(<col>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 确定要放入数组的值的表达式，支持类型为 Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，Timestamptz，IPV4，IPV6，String，Array，Map，Struct。|

## 返回值

返回 ARRAY 类型的值，特殊情况：

- 数组中元素不保证顺序。
- 返回转换生成的数组。数组中的元素类型与 `col` 类型一致。

## 举例

```sql
-- setup
CREATE TABLE test_doris_array_agg (
	c1 INT,
	c2 INT
) DISTRIBUTED BY HASH(c1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_doris_array_agg VALUES (1, 10), (1, 20), (1, 30), (2, 100), (2, 200), (3, NULL);
```

```sql
select c1, array_agg(c2) from test_doris_array_agg group by c1;
```

```text
+------+---------------+
| c1   | array_agg(c2) |
+------+---------------+
|    1 | [10, 20, 30]  |
|    2 | [100, 200]    |
|    3 | [null]        |
+------+---------------+
```

```sql
select array_agg(c2) from test_doris_array_agg where c1 is null;
```

```text
+---------------+
| array_agg(c2) |
+---------------+
| []            |
+---------------+
```

