---
{
    "title": "AI_CLASSIFY",
    "language": "ja",
    "description": "指定したラベルの集合にテキストを分類します。"
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

指定したラベルの集合にテキストを分類します。

## 構文

```sql
AI_CLASSIFY([<resource_name>], <text>, <labels>)
```

## 引数

|    引数      | 説明                                 |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | 指定するリソース名。省略可能       |
| `<text>`          | 分類するテキスト                   |
| `<labels>`        | 分類に使用するラベルの配列              |

## 戻り値

テキストに最もよく一致するラベルを一つ返します。

いずれかの入力が NULL の場合は NULL を返します。

結果は大規模言語モデルによって生成されるため、出力は変わることがあります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_CLASSIFY('Apache Doris is a databases system.', ['usage', 'introduce']) AS Result;
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