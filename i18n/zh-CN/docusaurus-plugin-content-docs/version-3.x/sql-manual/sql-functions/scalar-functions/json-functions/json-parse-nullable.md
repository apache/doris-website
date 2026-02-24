---
{
    "title": "JSON_PARSE_NULLABLE",
    "language": "zh-CN",
    "description": "JSONPARSENULLABLE 函数用于解析一个 JSON 字符串为有效的 JSON 对象。如果输入字符串无效或为 NULL，它将返回 NULL，而不会抛出错误。"
}
---

## 描述

`JSON_PARSE_NULLABLE` 函数用于解析一个 JSON 字符串为有效的 JSON 对象。如果输入字符串无效或为 NULL，它将返回 NULL，而不会抛出错误。

## 语法

```sql
JSON_PARSE_NULLABLE( <str> )
```
## 别名

- JSONB_PARSE_NULLABLE

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 格式的输入字符串。 |

## 返回值
如果输入字符串是有效的 JSON，返回对应的 JSON 对象。
如果输入字符串无效或为 NULL，返回 NULL。

## 示例

1.有效的 JSON 字符串：
```sql
SELECT JSON_PARSE_NULLABLE('{"name": "John", "age": 30}');
```

```sql
+-------------------------------------------------------+
| JSON_PARSE_NULLABLE('{"name": "John", "age": 30}')    |
+-------------------------------------------------------+
| {"name": "John", "age": 30}                           |
+-------------------------------------------------------+

```
2.无效的 JSON 字符串：
```sql
SELECT JSON_PARSE_NULLABLE('{"name": "John", "age": }');
```

```sql
+-------------------------------------------------------+
| JSON_PARSE_NULLABLE('{"name": "John", "age": }')      |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

```