---
{
    "title": "MAP_FROM_ARRAYS",
    "language": "zh-CN",
    "description": "根据键数组和值数组构造 MAP"
}
---

## 描述

根据键数组和值数组构造 `MAP<K, V>`。两个数组中相同位置的元素组成一个键值对。

## 语法

```sql
MAP_FROM_ARRAYS(<keys>, <values>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<keys>` | `ARRAY<K>` 类型。`K` 必须是 MAP 键支持的类型。数组本身及数组元素都可以为 `NULL`。 |
| `<values>` | `ARRAY<V>` 类型。数组本身及数组元素都可以为 `NULL`。两个数组均非 `NULL` 时，元素数量必须与 `<keys>` 相同。 |

## 返回值

返回 `MAP<K, V>`。

- 任一输入数组为 `NULL` 时，返回 `NULL`。
- 数组中的 `NULL` 元素会作为 `NULL` 键或值保留在结果中。
- 两个数组均非 `NULL` 且长度不同时，报错；任一数组为 `NULL` 时，不校验另一个数组的长度。
- 同一个键出现多次时，保留最后一次出现的值。
- 参数不是数组，或 `K` 不是 MAP 键支持的类型时，在分析阶段报错。

## 示例

```sql
SELECT map_from_arrays([1, 2], [10, 20]) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_arrays([1, 1], [10, 20]) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_arrays(CAST(NULL AS ARRAY<INT>), [10]);
```

```text
+-------------------------------------------------+
| map_from_arrays(CAST(NULL AS ARRAY<INT>), [10]) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```

```sql
SELECT map_from_arrays(
    array(CAST(NULL AS INT), 2),
    array(10, CAST(NULL AS INT))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

```sql
SELECT map_from_arrays([1, 2], [10]);
```

```text
ERROR 1105 (HY000): The key and value array offsets of function map_from_arrays must be identical
```
