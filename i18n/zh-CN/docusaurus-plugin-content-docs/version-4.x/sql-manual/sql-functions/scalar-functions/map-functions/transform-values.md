---
{
    "title": "TRANSFORM_VALUES",
    "language": "zh-CN",
    "description": "转换 Map 中的每一个值"
}
---

## 描述

对 Map 中的每一个键值对应用 Lambda 表达式，并使用原始键和转换后的值构造一个新的 Map。Lambda 表达式接收每个键值对的键和值作为参数。

:::note
自 Apache Doris 4.2 起支持该函数。
:::

## 语法

```sql
TRANSFORM_VALUES((<key>, <value>) -> <new_value>, <map>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<key>` | Lambda 参数，表示 Map 元素的键。 |
| `<value>` | Lambda 参数，表示 Map 元素的值。 |
| `<new_value>` | 生成返回 Map 中值的表达式。 |
| `<map>` | `MAP<K, V>` 类型的表达式。 |

## 返回值

返回 `MAP<K, V2>`，其中 `V2` 是 Lambda 返回值的类型。

- 输入 Map 中的键保持不变。
- 如果 `<map>` 为空，返回空 Map。
- 如果 `<map>` 为 `NULL`，返回 `NULL`。
- Lambda 返回的 `NULL` 值会被保留。

## 示例

```sql
SELECT transform_values((k, v) -> v + k, map(1, 10, 2, 20)) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:11, 2:22} |
+--------------+
```

```sql
SELECT transform_values(
    (k, v) -> if(k = 1, CAST(NULL AS INT), v),
    map(1, 10, 2, 20)) AS result;
```

```text
+----------------+
| result         |
+----------------+
| {1:null, 2:20} |
+----------------+
```

```sql
SELECT transform_values((k, v) -> v, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
