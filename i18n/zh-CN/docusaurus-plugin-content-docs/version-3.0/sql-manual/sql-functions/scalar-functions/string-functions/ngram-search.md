---
{
    "title": "NGRAM_SEARCH",
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

计算两个字符串的 N-gram 相似度。

N-gram 相似度（N-gram similarity）是一种基于 N-gram（N 元语法）的文本相似度计算方法。N-gram 相似度从 0 到 1，相似度越高证明两个字符串越相似。

N-gram 是指将一个文本串分成连续的 N 个字符或词语的集合。例如，对于字符串 'text'，当 N=2 时，其二元组（bi-gram）为：{“te”, “ex”, “xt”}。

N-gram 相似度的计算为 2 * |Intersection| / (|haystack set| + |pattern set|)

其中 |haystack set| 和 |pattern set| 分别是 `haystack` 和 `pattern` 的 N-gram，`Intersection` 是两个集合的交集。

注意，根据定义，相似度为 1 不代表两个字符串相同。


## 语法

```sql
DOUBLE ngram_search(VARCHAR haystack, VARCHAR pattern, INT gram_num)
```


## 参数

| 参数 | 说明 |
| -- | -- |
| `haystack` | 被检查的字符串，仅支持 ASCII 编码 |
| `pattern`  | 用于对比相似度的字符串，必须是常量，仅支持 ASCII 编码 |
| `gram_num` | N-gram 的 `N`，必须是常量 |


## 返回值

返回 `haystack` 和 `pattern` 的 N-gram 相似度。
特殊情况：如果 `haystack` 或者 `pattern` 的长度小于 `gram_num`，返回 0。


## 举例

```sql
mysql> SELECT ngram_search('123456789' , '12345' , 3);
+---------------------------------------+
| ngram_search('123456789', '12345', 3) |
+---------------------------------------+
|                                   0.6 |
+---------------------------------------+

mysql> SELECT ngram_search('abababab', 'babababa', 2);
+-----------------------------------------+
| ngram_search('abababab', 'babababa', 2) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```
