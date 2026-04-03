---
{
  "title": "AI_SIMILARITY",
  "language": "ja",
  "description": "2つのテキスト間のセマンティック類似度を決定します。"
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

2つのテキスト間の意味的類似性を判定します。

## 構文

```sql
AI_SIMILARITY([<resource_name>], <text_1>, <text_2>)
```
## パラメータ

| パラメータ        | 説明                |
|-------------------|---------------------------|
| `<resource_name>` | 指定されたリソース名 |
| `<text_1>`        | テキスト                      |
| `<text_2>`        | テキスト                      |

## 戻り値

0から10の間の浮動小数点数を返します。0は類似性なし、10は強い類似性を意味します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は固定されない場合があります。

## 例

宅配会社が受け取ったコメントを表す以下のテーブルがあるとします：

```sql
CREATE TABLE user_comments (
    id      INT,
    comment VARCHAR(500)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "1"
);
```
顧客感情でコメントをランク付けしたい場合は、以下を使用できます：

```sql
SELECT comment,
    AI_SIMILARITY('resource_name', 'I am extremely dissatisfied with their service.', comment) AS score
FROM user_comments ORDER BY score DESC LIMIT 5;
```
クエリ結果は次のようになる場合があります：

```text
+-------------------------------------------------+-------+
| comment                                         | score |
+-------------------------------------------------+-------+
| It arrived broken and I am really disappointed. |   7.5 |
| Delivery was very slow and frustrating.         |   6.5 |
| Not bad, but the packaging could be better.     |   3.5 |
| It is fine, nothing special to mention.         |     3 |
| Absolutely fantastic, highly recommend it.      |     1 |
+-------------------------------------------------+-------+
```
