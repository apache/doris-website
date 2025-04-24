---
{
    "title": "ESQUERY",
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

`ESQUERY(<field>, <query_dsl>)` 函数用于将无法用 SQL 表达的查询下推到 Elasticsearch 进行过滤。  
第一个参数 `<field>` 用于关联索引，第二个参数 `<query_dsl>` 为 Elasticsearch 的基本 Query DSL 的 JSON 表达式，  
JSON 需使用 `{}` 包裹，并且必须包含且仅包含一个根键，例如 `match_phrase`、`geo_shape`、`bool` 等。

## 语法

```sql
ESQUERY(<field>, <query_dsl>)
```

## 参数

| 参数        | 说明                                                       |
|------------|------------------------------------------------------------|
| `<field>`    | 需要查询的字段，用于关联 Elasticsearch 索引。              |
| `<query_dsl>` | Elasticsearch Query DSL 的 JSON 表达式，需使用 `{}` 包裹，并且根键必须唯一（如 `match_phrase`、`geo_shape`、`bool`）。 |

## 返回值

返回一个布尔值，表示该文档是否匹配提供的 Elasticsearch 查询 DSL。

## 举例

```sql
-- match_phrase 查询：
SELECT * FROM es_table 
WHERE ESQUERY(k4, '{
    "match_phrase": {
       "k4": "doris on es"
    }
}');
```

```sql
-- geo_shape 查询：
SELECT * FROM es_table 
WHERE ESQUERY(k4, '{
  "geo_shape": {
     "location": {
        "shape": {
           "type": "envelope",
           "coordinates": [
              [13, 53],
              [14, 52]
           ]
        },
        "relation": "within"
     }
  }
}');
```