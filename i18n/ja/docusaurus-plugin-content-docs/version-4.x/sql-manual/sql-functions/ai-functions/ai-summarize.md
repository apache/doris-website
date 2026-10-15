---
{
    "title": "AI_SUMMARIZE",
    "language": "ja",
    "description": "テキストの簡潔な要約を生成します。"
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

## 説明

テキストの簡潔な要約を生成します。

## 構文

```sql
AI_SUMMARIZE([<resource_name>], <text>)
```

## 引数

| 引数 | 説明 |
| --- | --- |
| `<resource_name>` | 指定するリソース名。省略可能 |
| `<text>` | 要約するテキスト |

## 戻り値

テキストの簡潔な要約を返します。

いずれかの入力が NULL の場合は NULL を返します。

結果は大規模言語モデルによって生成されるため、出力は変わることがあります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SUMMARIZE('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.') AS Result;
```
```text
+-------------------------------------------------------------------+
| Result                                                            |
+-------------------------------------------------------------------+
| Apache Doris is a high-speed, MPP-based real-time data warehouse. |
+-------------------------------------------------------------------+
```

```sql
SELECT AI_SUMMARIZE('resource_name','Doris supports high-concurrency, real-time analytics and is widely used in business intelligence scenarios.') AS Result;
```

```text
+------------------------------------------------------------------------------------------------+
| Result                                                                                         |
+------------------------------------------------------------------------------------------------+
| Doris is a high-concurrency, real-time analytics tool commonly used for business intelligence. |
+------------------------------------------------------------------------------------------------+
```
