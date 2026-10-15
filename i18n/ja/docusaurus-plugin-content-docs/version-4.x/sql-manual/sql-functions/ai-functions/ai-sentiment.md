---
{
    "title": "AI_SENTIMENT",
    "language": "ja",
    "description": "テキストの感情を分析します。"
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

テキストの感情を分析します。

## 構文

```sql
AI_SENTIMENT([<resource_name>], <text>)
```

## 引数

|    引数      | 説明                |
| ----------------- | ------------------------- |
| `<resource_name>` | 指定するリソース名|
| `<text>`          | 感情を分析するテキスト |

## 戻り値

感情分析の結果を返します。値には次のものがあります。
- positive
- negative
- neutral
- mixed

いずれかの入力が NULL の場合は NULL を返します。

結果は大規模言語モデルによって生成されるため、出力は変わることがあります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doris is a great DB system.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| positive |
+----------+
```

```sql
SELECT AI_SENTIMENT('resource_name', 'I hate sunny days.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| negative |
+----------+
```