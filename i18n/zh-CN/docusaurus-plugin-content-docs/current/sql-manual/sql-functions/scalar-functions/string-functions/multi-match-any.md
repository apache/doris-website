---
{
    "title": "MULTI_MATCH_ANY",
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

返回字符串是否与给定的一组正则表达式匹配。


## 语法

```sql
TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)
```


## 参数

| 参数 | 说明 |
| -- | -- |
| `haystack` | 被检查的字符串 |
| `patterns` | 正则表达式数组 |


## 返回值

如果字符串 `haystack` 匹配 `patterns` 数组中的任意一个正则表达式返回 1，否则返回 0。


## 举例

```sql
mysql> SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']);
+-----------------------------------------------------------+
| multi_match_any('Hello, World!', ['hello', '!', 'world']) |
+-----------------------------------------------------------+
| 1                                                         |
+-----------------------------------------------------------+

mysql> SELECT multi_match_any('abc', ['A', 'bcd']);
+--------------------------------------+
| multi_match_any('abc', ['A', 'bcd']) |
+--------------------------------------+
| 0                                    |
+--------------------------------------+
```

