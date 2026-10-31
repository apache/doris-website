---
{
    "title": "JSON_PARSE_NULLABLE_ERROR_TO_VALUE",
    "language": "zh-CN",
    "description": "JSONPARSENULLABLEERRORTOVALUE 函数用于解析一个 JSON 字符串为有效的 JSON 对象。如果输入的 JSON 字符串无效，它将返回用户指定的默认值，而不是抛出错误。如果输入为 NULL，则返回默认值。"
}
---

## 描述

`JSON_PARSE_NULLABLE_ERROR_TO_VALUE` 函数用于解析一个 JSON 字符串为有效的 JSON 对象。如果输入的 JSON 字符串无效，它将返回用户指定的默认值，而不是抛出错误。如果输入为 `NULL`，则返回默认值。

## 语法

```sql
JSON_PARSE_NULLABLE_ERROR_TO_VALUE( <str> , <default_value>)
```
## 别名

- JSONB_PARSE_NULLABLE_ERROR_TO_VALUE

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 格式的输入字符串。 |
| `<default_value>` | 解析失败时返回的默认值。 |

## 返回值
如果输入字符串是有效的 JSON，返回对应的 JSON 对象。
如果输入字符串无效或为 NULL，返回 default_value 参数指定的默认值。

## 举例
1. 有效的 JSON 字符串：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": 30}', 'default');


```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": 30}', 'default') |
+---------------------------------------------------------------+
| {"name": "John", "age": 30}                                    |
+---------------------------------------------------------------+


```
2. 无效的 JSON 字符串：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": }', 'default');


```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": }', 'default') |
+---------------------------------------------------------------+
| default                                                       |
+---------------------------------------------------------------+

```
3. 输入为 NULL：
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE(NULL, 'default');


```
```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE(NULL, 'default')           |
+---------------------------------------------------------------+
| default                                                       |
+---------------------------------------------------------------+

```