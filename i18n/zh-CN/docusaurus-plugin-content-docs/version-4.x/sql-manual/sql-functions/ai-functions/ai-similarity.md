---
{
    "title": "AI_SIMILARITY",
    "language": "zh-CN",
    "description": "判断两个文本之间的语义相似性"
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

## 描述

判断两个文本之间的语义相似性

## 语法


```sql
AI_AI_SIMILARITY([<resource_name>], <text_1>, <text_2>)
```

## 参数

|    参数    | 说明 |
| ---------- | -------- |
| `<resource_name>`| 指定的资源名称|
| `<text_1>`   | 文本   |
| `<text_2>`   | 文本 |

## 返回值

返回一个 0 - 10 之间的浮点数。0 表示无相似性，10 表示强相似性。

当输入有值为 NULL 时返回 NULL

结果为大模型生成，所以返回内容并不固定

## 示例

假设我有如下表，代表某家快递公司收到的评论：
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

当我想按顾客语气情绪对评论进行排行时可以：
```sql
SELECT comment,
    AI_SIMILARITY('resource_name', 'I am extremely dissatisfied with their service.', comment) AS score
FROM user_comments ORDER BY score DESC LIMIT 5;
```

查询结果大致如下：
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