---
{
    "title": "AI_SIMILARITY",
    "language": "ja",
    "description": "二つのテキスト間の意味的類似度を判定します。"
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

二つのテキスト間の意味的類似度を判定します。

## 構文

```sql
AI_SIMILARITY([<resource_name>], <text_1>, <text_2>)
```

## 引数

| 引数         | 説明                |
|-------------------|---------------------------|
| `<resource_name>` | 指定するリソース名 |
| `<text_1>`        | テキスト                      |
| `<text_2>`        | テキスト                      |

## 戻り値

0 から 10 の浮動小数点値を返します。0 は類似性がないことを、10 は類似性が高いことを示します。

いずれかの入力が NULL の場合は NULL を返します。

結果は大規模言語モデルによって生成されるため、出力は一定ではありません。

## 例

配送会社に届いたコメントを表す次のテーブルがあるとします。
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

顧客の感情に基づいてコメントを順位付けするには、次のようにします。
```sql
SELECT comment,
    AI_SIMILARITY('resource_name', 'I am extremely dissatisfied with their service.', comment) AS score
FROM user_comments ORDER BY score DESC LIMIT 5;
```

クエリ結果の例:
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