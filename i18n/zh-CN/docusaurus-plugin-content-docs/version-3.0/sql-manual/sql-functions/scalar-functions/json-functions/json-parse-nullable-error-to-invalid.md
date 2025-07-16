---
{
    "title": "JSON_PARSE_NULLABLE_ERROR_TO_INVALID",
    "language": "zh-CN"
}
---

## 描述

`JSON_PARSE_NULLABLE_ERROR_TO_INVALID` 函数用于解析一个 JSON 字符串为有效的 JSON 对象。如果输入的 JSON 字符串无效，它将返回一个 "无效的 JSON" 标记（通常为 `INVALID_JSON`），而不会抛出错误。如果输入为 `NULL`，也会返回 `INVALID_JSON`。

## 语法

```sql
JSON_PARSE_NULLABLE_ERROR_TO_INVALID( <str> )
```
## 别名

- JSONB_PARSE_NULLABLE_ERROR_TO_INVALID

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 格式的输入字符串。 |

## 返回值
如果输入字符串是有效的 JSON，返回对应的 JSON 对象。
如果输入字符串无效或为 NULL，返回 INVALID_JSON 标记。

## 举例
1. 有效的 JSON 字符串：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": 30}');

```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": 30}') |
+---------------------------------------------------------------+
| {"name": "John", "age": 30}                                    |
+---------------------------------------------------------------+

```
2. 无效的 JSON 字符串：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": }');

```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID('{"name": "John", "age": }') |
+---------------------------------------------------------------+
| INVALID_JSON                                                  |
+---------------------------------------------------------------+

```
3. 输入为 NULL：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_INVALID(NULL);

```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_INVALID(NULL)                    |
+---------------------------------------------------------------+
| INVALID_JSON                                                  |
+---------------------------------------------------------------+

```
