---
{
    "title": "COUNT_SUBSTRINGS",
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

## count_substrings

### description

#### Syntax

`int count_substrings(STRING str, STRING pattern)`
返回字符串str中包含子串pattern的总个数。
注意: 当前实现为在str 中每匹配到子串时，就会偏移一个子串长度继续寻找
所以当`str:ccc, pattern:cc` 时，返回结果为1

#### Arguments

`str` — 需要检测的字符串. 类型: `String`
`pattern` — 是用来被匹配的子串. 类型: `String`


#### Returned value(s)

返回一个包含子字符串的总个数.

### example

```
mysql [(none)]>select count_substrings('a1b1c1d','1');
+----------------------------------+
| count_substrings('a1b1c1d', '1') |
+----------------------------------+
|                                3 |
+----------------------------------+

mysql [(none)]>select count_substrings(',,a,b,c,',',');
+-----------------------------------+
| count_substrings(',,a,b,c,', ',') |
+-----------------------------------+
|                                 5 |
+-----------------------------------+

mysql [(none)]>select count_substrings('ccc','cc');
+--------------------------------+
| count_substrings('ccc', 'cc')  |
+--------------------------------+
|                              1 |
+--------------------------------+


mysql [(none)]>SELECT count_substrings(NULL,',');
+-----------------------------+
| count_substrings(NULL, ',') |
+-----------------------------+
|                        NULL |
+-----------------------------+

mysql [(none)]>select count_substrings('a,b,c,abcde','');
+-------------------------------------+
| count_substrings('a,b,c,abcde', '') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+

mysql [(none)]>select count_substrings(NULL, 'a');
+-----------------------------+
| count_substrings(NULL, 'a') |
+-----------------------------+
|                        NULL |
+-----------------------------+

mysql [(none)]>select count_substrings('','asd');
+-----------------------------+
| count_substrings('', 'asd') |
+-----------------------------+
|                           0 |
+-----------------------------+

mysql [(none)]>select count_substrings('abccbaacb','c');
+------------------------------------+
| count_substrings('abccbaacb', 'c') |
+------------------------------------+
|                                  3 |
+------------------------------------+
```
### keywords

COUNT_SUBSTRINGS,SUBSTRINGS
