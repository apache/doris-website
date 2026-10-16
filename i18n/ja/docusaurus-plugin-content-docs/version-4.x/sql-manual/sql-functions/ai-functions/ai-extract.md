---
{
    "title": "AI_EXTRACT",
    "language": "ja",
    "description": "テキストから指定したラベルに対応する情報を抽出します。"
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

テキストから指定したラベルに対応する情報を抽出します。

## 構文

```sql
AI_EXTRACT([<resource_name>], <text>, <labels>)
```

## 引数

|    引数      | 説明                                  |
| ----------------- | -------------------------------------------- |
| `<resource_name>` | 指定するリソース名。省略可能        |
| `<text>`          | 情報を抽出する元のテキスト   |
| `<labels>`        | 抽出対象のラベルの配列                   |

## 戻り値

抽出したすべてのラベルと対応する値を含む文字列を返します。

いずれかの入力が NULL の場合は NULL を返します。

結果は大規模言語モデルによって生成されるため、出力は変わることがあります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_EXTRACT('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.', 
                  ['product_name', 'architecture', 'key_feature']) AS Result;
```
```text
+---------------------------------------------------------------------------------------+
| Result                                                                                |
+---------------------------------------------------------------------------------------+
| product_name="Apache Doris", architecture="MPP-based", key_feature="high query speed" |
+---------------------------------------------------------------------------------------+
```

```sql
SELECT AI_EXTRACT('resource_name', 'Apache Doris began in 2008 as an internal project named Palo.',
                  ['original name', 'founding time']) AS Result;
```
```text
+----------------------------------------+
| Result                                 |
+----------------------------------------+
| original name=Palo, founding time=2008 |
+----------------------------------------+
```