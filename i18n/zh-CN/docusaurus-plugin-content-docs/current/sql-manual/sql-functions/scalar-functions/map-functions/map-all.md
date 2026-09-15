---
{
    "title": "MAP_ALL",
    "language": "zh-CN",
    "description": "判断 Map 中的所有元素是否都满足指定条件"
}
---

## 描述

使用 Lambda 表达式检查 Map 中的每一个键值对，并判断所有键值对是否都满足指定条件。Lambda 表达式接收每个键值对的键和值作为参数。

## 语法

```sql
MAP_ALL((<key>, <value>) -> <predicate>, <map>)
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

- 如果任意一个元素的判断结果为 `FALSE`，返回 `FALSE`。
- 如果所有元素的判断结果均为 `TRUE`，返回 `TRUE`；空 Map 也返回 `TRUE`。
- 如果没有元素的判断结果为 `FALSE`，但至少有一个元素的判断结果为 `NULL`，返回 `NULL`。
- 如果 `<map>` 为 `NULL`，返回 `NULL`。

## 示例

```sql
SELECT map_all((k, v) -> v >= 10, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
|      1 |
+--------+
```

```sql
SELECT map_all((k, v) -> v > 10, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
|      0 |
+--------+
```

```sql
SELECT map_all((k, v) -> CAST(NULL AS BOOLEAN), map(1, 10)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

```sql
SELECT map_all((k, v) -> v > 0, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
