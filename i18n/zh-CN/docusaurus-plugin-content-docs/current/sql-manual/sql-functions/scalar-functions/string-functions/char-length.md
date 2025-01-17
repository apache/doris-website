---
{
    "title": "CHAR_LENGTH",
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

计算字符串的长度，对于多字节字符，返回字符数。

目前仅支持 `utf8` 编码

## 别名

- character_length

## 语法

```sql 
char_length(VARCHAR str)
```

## 参数

| 参数 | 说明         |
| -- |------------|
| `str` | 需要计算长度的字符串 |

## 返回值

字符串 str 的长度。

## 举例

```sql
select char_length("abc"),char_length("中国")
```

```text
+-------------------------+----------------------------+
| character_length('abc') | character_length('中国')   |
+-------------------------+----------------------------+
|                       3 |                          2 |
+-------------------------+----------------------------+
```