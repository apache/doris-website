---
{
    "title": "TRANSFORM_KEYS",
    "language": "zh-CN",
    "description": "转换 Map 中的每一个键"
}
---

## 描述

对 Map 中的每一个键值对应用 Lambda 表达式，并使用转换后的键和原始值构造一个新的 Map。Lambda 表达式接收每个键值对的键和值作为参数。

## 语法

```sql
TRANSFORM_KEYS((<key>, <value>) -> <new_key>, <map>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<key>` | Lambda 参数，表示 Map 元素的键。 |
| `<value>` | Lambda 参数，表示 Map 元素的值。 |
| `<new_key>` | 生成返回 Map 中键的表达式，其类型必须是 Map 键支持的类型。 |
| `<map>` | `MAP<K, V>` 类型的表达式。 |

## 返回值

返回 `MAP<K2, V>`，其中 `K2` 是 Lambda 返回值的类型。

- 输入 Map 中的值保持不变。
- 如果 `<map>` 为空，返回空 Map。
- 如果 `<map>` 为 `NULL`，返回 `NULL`。
- Lambda 返回的 `NULL` 键会被保留。
- 如果多个元素转换为相同的新键，保留最后一次出现的值。

## 示例

```sql
SELECT transform_keys((k, v) -> k + 10, map(1, 10, 2, 20)) AS result;
```

```text
+----------------+
| result         |
+----------------+
| {11:10, 12:20} |
+----------------+
```

```sql
SELECT transform_keys((k, v) -> 1, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT transform_keys((k, v) -> k, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
