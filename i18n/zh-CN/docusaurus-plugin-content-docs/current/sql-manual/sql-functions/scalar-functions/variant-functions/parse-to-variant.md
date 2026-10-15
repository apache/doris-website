---
{
    "title": "PARSE_TO_VARIANT",
    "language": "zh-CN",
    "description": "PARSE_TO_VARIANT 将 JSON 文本或 JSON/JSONB 表达式中的完整 JSON 值解析为带类型信息的 VARIANT，并说明输入、返回值、错误行为与示例。"
}
---

## 功能

`PARSE_TO_VARIANT` 将一个完整 JSON 值解析为 `VARIANT`，支持 JSON 对象、数组、字符串、数字、布尔值和 JSON 字面量 `null`。该函数自 Doris 4.1.4 起支持；本页描述的是 Doris 5.0.0 及之后版本中的行为。

## 语法

```sql
PARSE_TO_VARIANT(<json_value>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<json_value>` | 包含一个完整 JSON 值的 `CHAR`、`VARCHAR` 或 `STRING` 表达式，也可以是 `JSON`/`JSONB` 表达式。JSON/JSONB 输入会先转换为 JSON 文本，再解析为 VARIANT。 |

## 返回值

返回 `VARIANT` 值。

- 输入为 SQL `NULL` 时返回 SQL `NULL`。
- 输入为 JSON 字面量 `null` 时返回 VARIANT `null`，它与 SQL `NULL` 不同。
- 非法 JSON 文本会作为 VARIANT 字符串返回；包含超出 [-2^63, 2^64 - 1] 的整数或超出 `DOUBLE` 范围的数值的 JSON 也是如此，整段文本变为一个字符串。该行为由 BE 配置 `variant_throw_exeception_on_invalid_json`（默认 `false`）控制；设置为 `true` 后，这类输入会使查询失败。
- 输入为空字符串时返回空对象 `{}`。
- 嵌套深到 JSON 解析器本身拒绝的文档（约 1000 层）属于非法 JSON，同样作为字符串返回。
- 以下情况查询失败：对象 key 超过 `variant_max_json_key_length` 字节（BE 配置，默认 255）；同一对象中有重复 key（BE 配置 `variant_enable_duplicate_json_path_check` 为 `true` 时保留第一个值，不报错）；嵌套超过 128 层；字符串不是合法的 UTF-8。

## 示例

解析 JSON 文本：

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------+
| value                            |
+----------------------------------+
| {"id":42,"tags":["doris","sql"]} |
+----------------------------------+
```

解析 JSON/JSONB 表达式：

```sql
SELECT CAST(
           PARSE_TO_VARIANT(CAST('{"id": 42}' AS JSON))
           AS STRING
       ) AS value;
```

```text
+-----------+
| value     |
+-----------+
| {"id":42} |
+-----------+
```

提取值并 CAST 为具体 SQL 类型：

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"user": {"id": 42}}')['user']['id']
           AS BIGINT
       ) AS user_id;
```

```text
+---------+
| user_id |
+---------+
|      42 |
+---------+
```

SQL `NULL` 仍返回 SQL `NULL`：

```sql
SELECT PARSE_TO_VARIANT(NULL) IS NULL AS is_sql_null;
```

```text
+-------------+
| is_sql_null |
+-------------+
|           1 |
+-------------+
```

非法 JSON 文本会保留为字符串：

```sql
SELECT CAST(PARSE_TO_VARIANT('{"id":') AS STRING) AS value,
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS type;
```

```text
+--------+--------+
| value  | type   |
+--------+--------+
| {"id": | string |
+--------+--------+
```

重复 key 会报错：

```sql
SELECT PARSE_TO_VARIANT('{"id": 1, "id": 2}');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INVALID_ARGUMENT]Duplicate Variant object key
```

## 使用说明

- 如果希望解析错误返回 SQL `NULL` 而不是使查询失败，请使用 [TRY_PARSE_TO_VARIANT](./try-parse-to-variant.md)。
- `PARSE_TO_VARIANT` 会显式解析 JSON。相比之下，`CAST(string AS VARIANT)` 以及通过 `INSERT` 把字符串写入 VARIANT 列，都会把输入保留为 VARIANT 字符串，不解析 JSON。用 `INSERT` 写入 JSON 文本时，请用 `PARSE_TO_VARIANT` 包裹。详见[写入数据](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#write-data)与[其他类型 CAST 为 VARIANT](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#cast-to-variant)。
