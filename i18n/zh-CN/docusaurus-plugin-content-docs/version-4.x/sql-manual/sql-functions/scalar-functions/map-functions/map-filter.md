---
{
    "title": "MAP_FILTER",
    "language": "zh-CN",
    "description": "使用 Lambda 表达式或布尔数组过滤 Map 元素"
}
---

## 描述

过滤 Map 中的元素，并返回只包含选中元素的新 Map。

Lambda 形式对每一个键值对计算布尔表达式，Lambda 表达式接收每个键值对的键和值作为参数。布尔数组形式按照数组中的对应位置选择 Map 元素。

:::note
自 Apache Doris 4.2 起支持该函数。
:::

## 语法

```sql
MAP_FILTER((<key>, <value>) -> <predicate>, <map>)
MAP_FILTER(<map>, <filter_array>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<key>` | Lambda 参数，表示 Map 元素的键。 |
| `<value>` | Lambda 参数，表示 Map 元素的值。 |
| `<predicate>` | 对每个 Map 元素求值的布尔表达式，结果为 `TRUE` 的元素会被保留。 |
| `<map>` | `MAP<K, V>` 类型的表达式。 |
| `<filter_array>` | `ARRAY<BOOLEAN>` 类型的表达式。数组中的每个元素选择 Map 中对应位置的元素，数组长度必须与 Map 的元素数量相同。 |

## 返回值

返回包含选中元素的 `MAP<K, V>`。

- 在 Lambda 形式中，判断结果为 `FALSE` 或 `NULL` 的元素会被移除。
- 在布尔数组形式中，对应元素为 `FALSE` 或 `NULL` 的 Map 元素会被移除。
- 如果 `<map>` 为空，返回空 Map。
- 如果 `<map>` 为 `NULL`，返回 `NULL`。
- 在布尔数组形式中，如果 `<filter_array>` 为 `NULL`，返回 `NULL`。

## 示例

```sql
SELECT map_filter((k, v) -> v >= 20, map(1, 10, 2, 20, 3, 30)) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {2:20, 3:30} |
+--------------+
```

```sql
SELECT map_filter(
    (k, v) -> if(k = 1, CAST(NULL AS BOOLEAN), TRUE),
    map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {2:20} |
+--------+
```

```sql
SELECT map_filter(map(1, 10, 2, 20), [TRUE, FALSE]) AS result;
```

```text
+--------+
| result |
+--------+
| {1:10} |
+--------+
```

```sql
SELECT map_filter((k, v) -> TRUE, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
