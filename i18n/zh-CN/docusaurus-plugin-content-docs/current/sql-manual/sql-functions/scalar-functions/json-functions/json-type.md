---
{
    "title": "JSON_TYPE",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->



## 描述

用来判断json_path指定的字段在JSONB数据中的类型，如果字段不存在返回NULL，如果存在返回下面的类型之一

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
STRING JSON_TYPE( <JSON j> )
```

## 别名

- JSONB_TYPE

## 必选参数

| 参数 | 描述 |
|------|------|
| `<JSON j>` | 需要检查类型的 JSON 字符串。 |


## 返回值
返回 JSON 字符串的类型，可能的值包括：
- "NULL"：表示 JSON 文档的值为 null。
- "BOOLEAN"：表示 JSON 文档的值为布尔类型（true 或 false）。
- "NUMBER"：表示 JSON 文档的值为数字类型。
- "STRING"：表示 JSON 文档的值为字符串类型。
- "OBJECT"：表示 JSON 文档的值为 JSON 对象。
- "ARRAY"：表示 JSON 文档的值为 JSON 数组。

## 示例
1. JSON 为字符串类型：

```sql
SELECT JSON_TYPE('"Hello, World!"');
```

```sql
+------------------------------------------+
| JSON_TYPE('"Hello, World!"')            |
+------------------------------------------+
| STRING                                   |
+------------------------------------------+
```

2. JSON 为数字类型：

```sql
SELECT JSON_TYPE('123');
```
```sql
+------------------------------------------+
| JSON_TYPE('123')                        |
+------------------------------------------+
| NUMBER                                   |
+------------------------------------------+
```
3. JSON 为 null 类型：
```sql
SELECT JSON_TYPE('null');
```
```sql
+------------------------------------------+
| JSON_TYPE('null')                        |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```
## 注意事项

JSON_TYPE 返回的是 JSON 文档中最外层的值的类型。如果 JSON 文档包含多个不同类型的值，则返回最外层值的类型。
对于无效的 JSON 字符串，JSON_TYPE 会返回 NULL。
参考 [json tutorial](../../sql-reference/Data-Types/JSON.md) 中的示例



