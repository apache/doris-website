---
{
    "title": "GROUP_ARRAY_UNION",
    "language": "zh-CN",
    "description": "求出所有行中输入数组中的去重后的并集元素，返回一个新的数组"
}
---

## 描述

求出所有行中输入数组中的去重后的并集元素，返回一个新的数组

## 语法

```sql
GROUP_ARRAY_UNION(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要求并集的表达式，支持类型为 Array<Type>, 不支持Array的复杂类型嵌套。 |

## 返回值

返回一个包含并集结果的数组。
如果组内没有合法数据，则返回空数组。

## 举例

```sql
-- setup
CREATE TABLE group_array_union_test (
	id INT,
	c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_union_test VALUES
	(1, ['a', 'b', 'c', 'd', 'e']),
	(2, ['a', 'b']),
	(3, ['a', null]),
	(4, NULL);
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test;
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "c", "e", "b", "d", "a"]   |
+-----------------------------------+
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (3,4);
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "a"]                       |
+-----------------------------------+
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (4);
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| []                                |
+-----------------------------------+
```
