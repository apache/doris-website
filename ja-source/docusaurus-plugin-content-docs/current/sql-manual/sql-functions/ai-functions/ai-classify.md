---
{
  "title": "AI_CLASSIFY",
  "language": "ja",
  "description": "指定されたラベルのセットにテキストを分類するために使用されます。"
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

テキストを指定されたラベルのセットに分類するために使用されます。

## 構文

```sql
AI_CLASSIFY([<resource_name>], <text>, <labels>)
```
## パラメータ

|    パラメータ      | 説明                                 |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | 指定されたリソース名、オプション       |
| `<text>`          | 分類対象のテキスト                   |
| `<labels>`        | 分類ラベルの配列              |

## 戻り値

テキストに最も適合する単一のラベルを返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_CLASSIFY('Apache Doris is a databases system.', ['useage', 'introduce']) AS Result;
```
```text
+-----------+
| Result    |
+-----------+
| introduce |
+-----------+
```
```sql
SELECT AI_CLASSIFY('resource_name', 'Apache Doris is developing rapidly.', ['science', 'sport']) AS Result;
```
```text
+---------+
| Result  |
+---------+
| science |
+---------+
```
