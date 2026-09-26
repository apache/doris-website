---
{
    "title": "MAP_FROM_ENTRIES",
    "language": "zh-CN",
    "description": "根据二字段 STRUCT 数组构造 MAP"
}
---

## 描述

根据元素为二字段 `STRUCT` 的数组构造 `MAP<K, V>`。STRUCT 的第一个字段作为键，第二个字段作为值。

:::note
自 Apache Doris 4.2 起支持该函数。
:::

## 语法

```sql
MAP_FROM_ENTRIES(<entries>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<entries>` | `ARRAY<STRUCT<K, V>>` 类型。每个 STRUCT 必须恰好包含两个字段。数组本身可以为 `NULL`，STRUCT 内的两个字段也可以为 `NULL`，但 STRUCT 数组元素本身不能为 `NULL`。`K` 必须是 MAP 键支持的类型。 |

## 返回值

返回 `MAP<K, V>`。

- `<entries>` 为 `NULL` 时，返回 `NULL`。
- 非 `NULL` STRUCT 内的 `NULL` 字段会作为 `NULL` 键或值保留在结果中。
- STRUCT 数组元素本身为 `NULL` 时，在运行阶段报错。
- 输入不是 STRUCT 数组，或 STRUCT 少于或多于两个字段时，在分析阶段报错。
- `K` 不是 MAP 键支持的类型时，在分析阶段报错。
- 同一个键出现多次时，保留最后一次出现的值。

## 示例

```sql
SELECT map_from_entries(array(struct(1, 10), struct(2, 20))) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_entries(array(struct(1, 10), struct(1, 20))) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>));
```

```text
+------------------------------------------------------------+
| map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>)) |
+------------------------------------------------------------+
| NULL                                                       |
+------------------------------------------------------------+
```

```sql
SELECT map_from_entries(array(
    struct(CAST(NULL AS INT), 10),
    struct(2, CAST(NULL AS INT)))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

以下示例因为数组中包含 `NULL` STRUCT 元素而报错：

```sql
SELECT map_from_entries(array(CAST(NULL AS STRUCT<k:INT,v:INT>)));
```

```text
ERROR 1105 (HY000): Map entry of function map_from_entries cannot be null
```

以下示例因为 STRUCT 包含三个字段而在分析阶段报错：

```sql
SELECT map_from_entries(array(struct(1, 2, 3)));
```

```text
ERROR 1105 (HY000): map_from_entries requires an array of structs with exactly two fields
```
