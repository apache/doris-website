---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "zh-CN",
    "description": "TRY_PARSE_TO_VARIANT 尝试把完整 JSON 值解析为 VARIANT，并在解析或校验失败时返回 SQL NULL，而不是使当前查询直接失败。"
}
---

## 功能

`TRY_PARSE_TO_VARIANT` 尝试把一个完整 JSON 值解析为 `VARIANT`。函数名中的 `TRY_` 表示：发生解析错误时返回 SQL `NULL`，而不是使查询失败。该函数自 Doris 4.1.4 起支持。

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
- 对象 key 超过 `variant_max_json_key_length` 字节（BE 配置，默认 255），或同一对象中有重复 key 时，返回 SQL `NULL`。
- 不是合法 JSON 的文本与 [PARSE_TO_VARIANT](./parse-to-variant) 一样，作为 VARIANT 字符串返回。只有当 BE 配置 `variant_throw_exeception_on_invalid_json` 为 `true`（默认 `false`）时，才返回 SQL `NULL`。
- 输入为 SQL `NULL` 时返回 SQL `NULL`。
- JSON 字面量 `null` 返回 VARIANT `null`，不是 SQL `NULL`。

## 示例

保留合法值，并把解析错误转换为 SQL `NULL`：

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT('{"id": 1}')
           AS STRING
       ) AS valid_value,
       TRY_PARSE_TO_VARIANT('{"id": 1, "id": 2}') IS NULL AS duplicate_is_null,
       TRY_PARSE_TO_VARIANT(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-------------------+---------------+
| valid_value | duplicate_is_null | input_is_null |
+-------------+-------------------+---------------+
| {"id":1}    |                 1 |             1 |
+-------------+-------------------+---------------+
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

JSON `null` 不是 SQL `NULL`，不是合法 JSON 的文本保留为字符串：

```sql
SELECT TRY_PARSE_TO_VARIANT('null') IS NULL AS json_null_is_sql_null,
       VARIANT_TYPE(TRY_PARSE_TO_VARIANT('{"id":')) AS invalid_json_type;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | invalid_json_type |
+-----------------------+-------------------+
|                     0 | string            |
+-----------------------+-------------------+
```

## 使用说明

- 如果解析错误应该使查询失败并暴露数据质量问题，请使用 [PARSE_TO_VARIANT](./parse-to-variant)。
- 本函数只会把解析错误转换为 SQL `NULL`，不会改变合法 JSON `null` 的含义。
- Stream Load 等导入作业按与本函数相同的规则解析 JSON 文本，参见[解析错误](../../../basic-element/sql-data-types/semi-structured/VARIANT#parse-errors)。
