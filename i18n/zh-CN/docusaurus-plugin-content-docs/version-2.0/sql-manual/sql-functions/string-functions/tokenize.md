---
{
    "title": "TOKENIZE",
    "language": "zh-CN"
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

返回文本分词的结果。分词是将文本分一组词的过程。


## 语法

```sql
ARRAY<VARCHAR> tokenize(VARCHAR txt, VARCHAR tokenizer_args)
```


## 参数

| 参数 | 说明 |
| -- | -- |
| `txt`            | 待分词的文本 |
| `tokenizer_args` | 分词器参数，是一个 Doris PROPERTIES 格式的字符串，详细说明参考倒排索引的文档 |


## 返回值

返回对文本 `txt` 按照分词器参数 `tokenizer_args` 进行分词的结果。


## 举例

```sql
mysql> SELECT tokenize('武汉长江大桥', '"parser"="chinese","parser_mode"="fine_grained"');
+-----------------------------------------------------------------------------------+
| tokenize('武汉长江大桥', '"parser"="chinese","parser_mode"="fine_grained"')       |
+-----------------------------------------------------------------------------------+
| ["武汉", "武汉长江大桥", "长江", "长江大桥", "大桥"]                              |
+-----------------------------------------------------------------------------------+
1 row in set (0.02 sec)

mysql> SELECT tokenize('武汉市长江大桥', '"parser"="chinese","parser_mode"="fine_grained"');
+--------------------------------------------------------------------------------------+
| tokenize('武汉市长江大桥', '"parser"="chinese","parser_mode"="fine_grained"')        |
+--------------------------------------------------------------------------------------+
| ["武汉", "武汉市", "市长", "长江", "长江大桥", "大桥"]                               |
+--------------------------------------------------------------------------------------+
1 row in set (0.02 sec)

mysql> SELECT tokenize('武汉市长江大桥', '"parser"="chinese","parser_mode"="coarse_grained"');
+----------------------------------------------------------------------------------------+
| tokenize('武汉市长江大桥', '"parser"="chinese","parser_mode"="coarse_grained"')        |
+----------------------------------------------------------------------------------------+
| ["武汉市", "长江大桥"]                                                                 |
+----------------------------------------------------------------------------------------+
1 row in set (0.02 sec)

mysql> SELECT tokenize('I love Doris', '"parser"="english"');
+------------------------------------------------+
| tokenize('I love Doris', '"parser"="english"') |
+------------------------------------------------+
| ["i", "love", "doris"]                         |
+------------------------------------------------+
1 row in set (0.02 sec)

mysql> SELECT tokenize('I love CHINA 我爱我的祖国','"parser"="unicode"');
+-------------------------------------------------------------------+
| tokenize('I love CHINA 我爱我的祖国', '"parser"="unicode"')       |
+-------------------------------------------------------------------+
| ["i", "love", "china", "我", "爱", "我", "的", "祖", "国"]        |
+-------------------------------------------------------------------+
1 row in set (0.02 sec)
```
