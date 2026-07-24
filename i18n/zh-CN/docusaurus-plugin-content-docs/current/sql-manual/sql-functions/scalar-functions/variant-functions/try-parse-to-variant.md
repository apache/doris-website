---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "zh-CN",
    "description": "TRY_PARSE_TO_VARIANT 尝试把完整 JSON 值解析为 VARIANT，并在解析或校验失败时返回 SQL NULL，而不是使当前查询直接失败。"
}
---

## 功能

`TRY_PARSE_TO_VARIANT` 尝试把一个完整 JSON 值解析为 `VARIANT`。函数名中的 `TRY_` 表示：发生解析或校验错误时返回 SQL `NULL`，而不是使查询失败。该函数自 Doris 4.2 起支持。

## 语法

```sql
TRY_PARSE_TO_VARIANT(<json_value>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<json_value>` | 包含一个完整 JSON 值的 `CHAR`、`VARCHAR` 或 `STRING` 表达式，也可以是 `JSON`/`JSONB` 表达式。JSON/JSONB 输入会先转换为 JSON 文本，再解析为 VARIANT。 |

## 返回值

返回可为 NULL 的 `VARIANT` 值。

- 合法输入返回解析后的 VARIANT 值。
- 非法 JSON 或其他解析、校验错误返回 SQL `NULL`。
- 输入为 SQL `NULL` 时返回 SQL `NULL`。
- 合法的 JSON 字面量 `null` 返回 Variant/JSON `null`，不是 SQL `NULL`。

## 示例

保留合法值，并把非法 JSON 转换为 SQL `NULL`：

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT('{"id": 1}')
           AS STRING
       ) AS valid_value,
       TRY_PARSE_TO_VARIANT('{"id":') IS NULL AS invalid_is_null,
       TRY_PARSE_TO_VARIANT(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-----------------+---------------+
| valid_value | invalid_is_null | input_is_null |
+-------------+-----------------+---------------+
| {"id":1}    |               1 |             1 |
+-------------+-----------------+---------------+
```

解析 JSON/JSONB 输入：

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT(CAST('[10, 20, 30]' AS JSON))
           AS STRING
       ) AS value;
```

```text
+------------+
| value      |
+------------+
| [10,20,30] |
+------------+
```

JSON `null` 与 SQL `NULL` 仍然不同：

```sql
SELECT TRY_PARSE_TO_VARIANT('null') IS NULL AS json_null_is_sql_null,
       TRY_PARSE_TO_VARIANT('{') IS NULL AS error_is_sql_null;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | error_is_sql_null |
+-----------------------+-------------------+
|                     0 |                 1 |
+-----------------------+-------------------+
```

## 使用说明

- 如果非法输入应该使查询失败并暴露数据质量问题，请使用 [PARSE_TO_VARIANT](./parse-to-variant)。
- 本函数只会把解析和校验错误转换为 SQL `NULL`，不会改变合法 JSON `null` 的含义。
