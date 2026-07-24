---
{
    "title": "PARSE_TO_VARIANT",
    "language": "zh-CN",
    "description": "PARSE_TO_VARIANT 将 JSON 文本或 JSON/JSONB 表达式中的完整 JSON 值解析为带类型信息的 VARIANT，并说明输入、返回值、错误行为与示例。"
}
---

## 功能

`PARSE_TO_VARIANT` 将一个完整 JSON 值解析为 `VARIANT`，支持 JSON 对象、数组、字符串、数字、布尔值和 JSON 字面量 `null`。该函数自 Doris 4.2 起支持。

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
- 输入为 JSON 字面量 `null` 时返回 Variant/JSON `null`，它与 SQL `NULL` 不同。
- JSON 非法、对象 key 重复且当前校验设置不允许、嵌套深度超限或发生其他校验错误时，查询失败。

## 示例

解析 JSON 文本：

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------------+
| value                                  |
+----------------------------------------+
| {"id":42,"tags":["doris","sql"]}    |
+----------------------------------------+
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

非法 JSON 会报错：

```sql
SELECT PARSE_TO_VARIANT('{"id":');
```

```text
ERROR: Parse json document failed
```

## 使用说明

- 如果希望把非法输入转换为 SQL `NULL`，请使用 [TRY_PARSE_TO_VARIANT](./try-parse-to-variant)。
- `PARSE_TO_VARIANT` 会显式解析 JSON。相比之下，`CAST(string AS VARIANT)` 会把输入保留为 VARIANT 字符串，不解析 JSON，详见 [VARIANT CAST 规则](../../../basic-element/sql-data-types/semi-structured/VARIANT#cast-规则)。
