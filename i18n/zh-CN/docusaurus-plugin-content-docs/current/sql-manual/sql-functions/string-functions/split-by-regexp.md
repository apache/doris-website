---
{
    "title": "SPLIT_BY_REGEXP",
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

## split_by_regexp


### description

#### Syntax

`ARRAY<STRING> split_by_regexp(STRING str, STRING pattern[, int max_limit])`
将字符串 `str` ,根据输入的正则表达式 `pattern` 进行拆分，可选择保留的个数 `max_limit` ,默认全部保留, 最终返回一个拆分好的字符串数组。

#### Arguments

`str` — 需要分割的字符串. 类型: `String`
`pattern` — 正则表达式. 类型: `String`
`max_limit` — 保留个数，可选参数. 类型: `Int`

### example

```
mysql [test_query_qa]>select split_by_regexp('abcde',"");
+------------------------------+
| split_by_regexp('abcde', '') |
+------------------------------+
| ["a", "b", "c", "d", "e"]    |
+------------------------------+
1 row in set (0.02 sec)

mysql [test_query_qa]>select split_by_regexp('a12bc23de345f',"\\d+");
+-----------------------------------------+
| split_by_regexp('a12bc23de345f', '\d+') |
+-----------------------------------------+
| ["a", "bc", "de", "f"]                  |
+-----------------------------------------+
1 row in set (0.01 sec)
```
### keywords

SPLIT_BY_REGEXP
