---
{
    "title": "BIT_LENGTH",
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

用于返回一个字符串的 二进制表示 中 位数（即总的二进制位数）。它计算的是字符串的二进制编码所占的位数。

## 语法
```sql
bit_length( <str>)
```

## 参数
| 参数    | 说明         |
|-------|------------|
| `<str>` |  需计算的字符串 |

## 返回值

返回 `<str>` 的二进制表示中所占用的位数，包括所有的 0 和 1。

## 举例

```sql
select bit_length("abc"), bit_length("中国"), bit_length(123);
```

```text
+-------------------+----------------------+-----------------------------------------+
| bit_length('abc') | bit_length('中国')   | bit_length(cast(123 as VARCHAR(65533))) |
+-------------------+----------------------+-----------------------------------------+
|                24 |                   48 |                                      24 |
+-------------------+----------------------+-----------------------------------------+
```
