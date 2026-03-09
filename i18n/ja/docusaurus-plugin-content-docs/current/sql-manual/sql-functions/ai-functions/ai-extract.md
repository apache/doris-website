---
{
  "title": "AI_EXTRACT",
  "language": "ja",
  "description": "テキストから特定のラベルに対応する情報を抽出するために使用されます。"
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

テキストから特定のラベルに対応する情報を抽出するために使用されます。

## 構文

```sql
AI_EXTRACT([<resource_name>], <text>, <labels>)
```
## パラメータ

|    パラメータ      | 説明                                  |
| ----------------- | -------------------------------------------- |
| `<resource_name>` | 指定されたリソース名、オプション        |
| `<text>`          | 情報を抽出するテキスト   |
| `<labels>`        | 抽出するラベルの配列                   |

## 戻り値

抽出されたすべてのラベルとその対応する値を含む文字列を返します。

入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

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
