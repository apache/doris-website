---
{
    "title": "MAP_EXISTS",
    "language": "zh-CN",
    "description": "判断 Map 中是否存在满足指定条件的元素"
}
---

## 描述

使用 Lambda 表达式检查 Map 中的每一个键值对，并判断是否至少有一个键值对满足指定条件。Lambda 表达式接收每个键值对的键和值作为参数。

:::note
自 Apache Doris 4.2 起支持该函数。
:::

## 语法

```sql
MAP_EXISTS((<key>, <value>) -> <predicate>, <map>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<key>` | Lambda 参数，表示 Map 元素的键。 |
| `<value>` | Lambda 参数，表示 Map 元素的值。 |
| `<predicate>` | 对每个 Map 元素求值的布尔表达式。 |
| `<map>` | `MAP<K, V>` 类型的表达式。 |

## 返回值

返回 `BOOLEAN` 类型的值。

- 如果任意一个元素的判断结果为 `TRUE`，返回 `TRUE`。
- 如果所有元素的判断结果均为 `FALSE`，返回 `FALSE`；空 Map 也返回 `FALSE`。
- 如果没有元素的判断结果为 `TRUE`，但至少有一个元素的判断结果为 `NULL`，返回 `NULL`。
- 如果 `<map>` 为 `NULL`，返回 `NULL`。

## 示例

```sql
SELECT map_exists((k, v) -> v = 20, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
|      1 |
+--------+
```

```sql
SELECT map_exists((k, v) -> v > 20, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
|      0 |
+--------+
```

```sql
SELECT map_exists((k, v) -> CAST(NULL AS BOOLEAN), map(1, 10)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

```sql
SELECT map_exists((k, v) -> v > 0, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
