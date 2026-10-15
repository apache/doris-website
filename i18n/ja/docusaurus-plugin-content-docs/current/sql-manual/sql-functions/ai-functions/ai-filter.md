---
{
    "title": "AI_FILTER",
    "language": "ja",
    "description": "指定した条件に基づいてテキストをフィルタリングします。"
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

指定した条件に基づいてテキストをフィルタリングします。

## 構文

```sql
AI_FILTER([<resource_name>], <text>)
```

## 引数

| 引数         | 説明                       |
|-------------------|-----------------------------------|
| `<resource_name>` | 指定するリソース名。省略可能 |
| `<text>`          | 評価する情報   |

## 戻り値

真偽値を返します。

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

肯定的なコメントを検索するには、次のようにします。
```sql
SELECT id, comment FROM user_comments
WHERE AI_FILTER('resource_name', CONCAT('This is a positive comment: ', comment));
```

結果の例:
```text
+------+--------------------------------------------+
| id   | comment                                    |
+------+--------------------------------------------+
|    1 | Absolutely fantastic, highly recommend it. |
|    3 | This product is amazing and I love it.     |
+------+--------------------------------------------+
```