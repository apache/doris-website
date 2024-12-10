---
{
    "title": "REGEXP_EXTRACT_ALL",
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

## regexp_extract_all
### description
#### Syntax

`VARCHAR regexp_extract_all(VARCHAR str, VARCHAR pattern)`

对字符串 str 进行正则匹配，抽取符合 pattern 的第一个子模式匹配部分。需要 pattern 完全匹配 str 中的某部分，这样才能返回 pattern 部分中需匹配部分的字符串数组。如果没有匹配或者pattern没有子模式，返回空字符串。

字符集匹配需要使用 Unicode 标准字符类型。例如，匹配中文请使用 `\p{Han}`。

### example

```sql
mysql> SELECT regexp_extract_all('AbCdE', '([[:lower:]]+)C([[:lower:]]+)');
+--------------------------------------------------------------+
| regexp_extract_all('AbCdE', '([[:lower:]]+)C([[:lower:]]+)') |
+--------------------------------------------------------------+
| ['b']                                                        |
+--------------------------------------------------------------+

mysql> SELECT regexp_extract_all('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)');
+-----------------------------------------------------------------+
| regexp_extract_all('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)') |
+-----------------------------------------------------------------+
| ['b','f']                                                       |
+-----------------------------------------------------------------+

mysql> SELECT regexp_extract_all('abc=111, def=222, ghi=333','("[^"]+"|\\w+)=("[^"]+"|\\w+)');
+--------------------------------------------------------------------------------+
| regexp_extract_all('abc=111, def=222, ghi=333', '("[^"]+"|\w+)=("[^"]+"|\w+)') |
+--------------------------------------------------------------------------------+
| ['abc','def','ghi']                                                            |
+--------------------------------------------------------------------------------+

mysql> select regexp_extract_all('这是一段中文This is a passage in English 1234567', '(\\p{Han}+)(.+)');
+------------------------------------------------------------------------------------------------+
| regexp_extract_all('这是一段中文This is a passage in English 1234567', '(\p{Han}+)(.+)')       |
+------------------------------------------------------------------------------------------------+
| ['这是一段中文']                                                                               |
+------------------------------------------------------------------------------------------------+
```

### keywords
    REGEXP_EXTRACT_ALL,REGEXP,EXTRACT,ALL
