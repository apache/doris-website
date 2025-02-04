---
{
"title": "SUB_REPLACE",
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

`sub_replace` 函数用于替换字符串中的子字符串。可以指定要替换的子字符串和替换的目标字符串，返回用`new_str` 字符串替换 `str` 中从 `start` 开始长度为len的新字符串。其中 `start`, `len` 为负整数，返回 NULL, 且 `len` 的默认值为 `new_str` 的长度。

## 语法

```sql
sub_replace(<str>, <new_str>, [ ,<start> [ , <len> ] ])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str>` | 要进行替换操作的目标字符串 |
| `<new_str>` | 用于替换的目标字符串 |
| `<start>` | 是替换操作开始的位置，表示从字符串中的哪个位置开始进行替换 |
| `<len>` |  是一个可选参数，表示要替换的子字符串的长度 |

## 返回值

返回替换后的字符串。

## 举例

```
select sub_replace("this is origin str","NEW-STR",1);
```

```text
+-------------------------------------------------+
| sub_replace('this is origin str', 'NEW-STR', 1) |
+-------------------------------------------------+
| tNEW-STRorigin str                              |
+-------------------------------------------------+
```

```sql
select sub_replace("doris","***",1,2);
```

```text
+-----------------------------------+
| sub_replace('doris', '***', 1, 2) |
+-----------------------------------+
| d***is                            |
+-----------------------------------+
```
