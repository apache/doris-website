---
{
  "title": "AI_GENERATE",
  "language": "ja",
  "description": "入力プロンプトテキストに基づいてレスポンスを生成します。"
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

入力プロンプトテキストに基づいてレスポンスを生成します。

## 構文

```sql
AI_GENERATE([<resource_name>], <prompt>)
```
## パラメータ

|    パラメータ      | 説明                                      |
| ----------------- | ------------------------------------------------|
| `<resource_name>` | 指定されたリソース名、オプション            |
| `<prompt>`        | AI生成を導くために使用されるプロンプトテキスト |

## 戻り値

プロンプトに基づいて生成されたテキストコンテンツを返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_GENERATE('Describe Apache Doris in a few words') AS Result;
```
```text
+---------------------------------------------------------+
| Result                                                  |
+---------------------------------------------------------+
| "Apache Doris is a fast, real-time analytics database." |
+---------------------------------------------------------+
```
```sql
SELECT AI_GENERATE('resource_name', 'What is the founding time of Apache Doris? Return only the date.') AS Result;
```
```text
+--------+
| Result |
+--------+
| 2017   |
+--------+
```
