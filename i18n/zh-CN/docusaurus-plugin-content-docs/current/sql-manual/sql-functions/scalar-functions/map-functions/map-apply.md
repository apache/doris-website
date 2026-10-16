---
{
    "title": "MAP_APPLY",
    "language": "zh-CN",
    "description": "同时转换 Map 中的键和值"
}
---

<version since="dev">

</version>

## 描述

对 Map 中的每一个键值对应用 Lambda 表达式，并使用转换后的键和值构造一个新的 Map。Lambda 表达式接收每个键值对的键和值，并返回一对表达式：第一个表达式作为新键，第二个表达式作为新值。

## 语法

```sql
MAP_APPLY((<key>, <value>) -> (<new_key>, <new_value>), <map>)
MAP_APPLY((<key>, <value>) -> STRUCT(<new_key>, <new_value>), <map>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<key>` | Lambda 参数，表示 Map 元素的键。 |
| `<value>` | Lambda 参数，表示 Map 元素的值。 |
| `<new_key>` | 生成返回 Map 中键的表达式，其类型必须是 Map 键支持的类型。 |
| `<new_value>` | 生成返回 Map 中值的表达式。 |
| `<map>` | `MAP<K, V>` 类型的表达式。 |

## 返回值

返回 `MAP<K2, V2>`。`K2` 和 `V2` 分别是 Lambda 返回的第一个字段和第二个字段的类型。

- 如果 `<map>` 为空，返回空 Map。
- 如果 `<map>` 为 `NULL`，返回 `NULL`。
- Lambda 返回字段中的 `NULL` 会保留为 Map 中的 `NULL` 键或值。
- 如果多个元素转换为相同的新键，保留最后一次出现的值。
- Lambda 必须返回恰好包含两个字段且整体不可为 NULL 的 `STRUCT`。元组语法 `(<new_key>, <new_value>)` 等价于 `STRUCT(<new_key>, <new_value>)`；整体可为 NULL 的结构体或字段数不为 2 的结果会触发分析错误。

## 示例

```sql
SELECT map_apply((k, v) -> (k + 10, v * 2), map(1, 10, 2, 20)) AS result;
```

```text
+------------------+
| result           |
+------------------+
| {11:20, 12:40}   |
+------------------+
```

```sql
SELECT map_apply((k, v) -> (1, v), map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_apply((k, v) -> (k, v), CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
