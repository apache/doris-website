---
{
"title": "COLLECT_SET",
"language": "zh-CN"
}
---

## 描述

将表达式的所有非 NULL 值去重后聚集成一个数组。

## 别名

- GROUP_UNIQ_ARRAY

## 语法

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 确定要放入数组的值的表达式，支持类型为 Bool，TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，IPV4，IPV6，String，Array，Map，Struct。 |
| `<max_size>` | 可选参数，通过设置该参数能够将结果数组的大小限制为 max_size 个元素，支持类型为 Integer。 |

## 返回值

返回类型是 ARRAY，该数组包含所有非 NULL 值。
如果组内没有合法数据，则返回空数组。

## 举例

```sql
-- setup
CREATE TABLE collect_set_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_set_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 10, 'a'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```

```sql
select collect_set(k1),collect_set(k1,2) from collect_set_test;
```

```text
+-----------------+-------------------+
| collect_set(k1) | collect_set(k1,2) |
+-----------------+-------------------+
| [2, 1, 3]       | [2, 1]            |
+-----------------+-------------------+
```

```sql
select k1,collect_set(k2),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```

```text
+------+-----------------+-------------------+
| k1   | collect_set(k2) | collect_set(k3,1) |
+------+-----------------+-------------------+
|    1 | [20, 10]        | ["a"]             |
|    2 | [200, 100]      | ["x"]             |
|    3 | []              | []                |
+------+-----------------+-------------------+
```
