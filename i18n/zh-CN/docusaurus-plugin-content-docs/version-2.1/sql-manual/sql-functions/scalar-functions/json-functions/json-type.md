---
{
    "title": "JSON_TYPE",
    "language": "zh-CN",
    "description": "用来判断 jsonpath 指定的字段在 JSONB 数据中的类型，如果字段不存在返回 NULL，如果存在返回下面的类型之一"
}
---

## 描述

用来判断 json_path 指定的字段在 JSONB 数据中的类型，如果字段不存在返回 NULL，如果存在返回下面的类型之一

- object
- array
- null
- bool
- int
- bigint
- largeint
- double
- string

## 语法

```sql
STRING JSON_TYPE( <json> )
```

## 别名

- JSONB_TYPE

## 必选参数

| 参数 | 描述 |
|------|------|
| `<json>` | 需要检查类型的 JSON 字符串。 |


## 返回值
返回 JSON 字符串的类型，可能的值包括：
- "NULL"：表示 JSON 文档的值为 null。
- "BOOLEAN"：表示 JSON 文档的值为布尔类型（true 或 false）。
- "NUMBER"：表示 JSON 文档的值为数字类型。
- "STRING"：表示 JSON 文档的值为字符串类型。
- "OBJECT"：表示 JSON 文档的值为 JSON 对象。
- "ARRAY"：表示 JSON 文档的值为 JSON 数组。

## 注意事项

JSON_TYPE 返回的是 JSON 文档中最外层的值的类型。如果 JSON 文档包含多个不同类型的值，则返回最外层值的类型。
对于无效的 JSON 字符串，JSON_TYPE 会返回 NULL。
参考 [json tutorial](../../../basic-element/sql-data-types/semi-structured/JSON) 中的示例


## 示例
1. JSON 为字符串类型

```sql
SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.name');
```

```sql
+-------------------------------------------------------------------+
| jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.name') |
+-------------------------------------------------------------------+
| string                                                            |
+-------------------------------------------------------------------+
```

2. JSON 为数字类型

```sql
SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.age');
```

```sql
+------------------------------------------------------------------+
| jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.age') |
+------------------------------------------------------------------+
| int                                                              |
+------------------------------------------------------------------+
```
