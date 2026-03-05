---
{
    "title": "GROUP_ARRAY_INTERSECT",
    "language": "zh-CN",
    "description": "求出所有行中输入数组中的交集元素，返回一个新的数组"
}
---

## 描述

求出所有行中输入数组中的交集元素，返回一个新的数组

## 语法

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要求交集的表达式，支持类型为 Array。 |

## 返回值

返回一个包含交集结果的数组。
如果组内没有合法数据，则返回空数组。

## 举例

```sql
-- setup
CREATE TABLE group_array_intersect_test (
	id INT,
	c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_intersect_test VALUES
	(1, ['a', 'b', 'c', 'd', 'e']),
	(2, ['a', 'b']),
	(3, ['a', null]);
```

```sql
select group_array_intersect(c_array_string) from group_array_intersect_test;
```

```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| ["a"]                                 |
+---------------------------------------+
```

```sql
select group_array_intersect(c_array_string) from group_array_intersect_test where id is null;
```

```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| []                                    |
+---------------------------------------+
```
