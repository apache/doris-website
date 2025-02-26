---
{
    "title": "LOCATE",
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

返回 substr 在 str 中出现的位置（从 1 开始计数）。如果指定第 3 个参数 pos，则从 str 以 pos 下标开始的字符串处开始查找 substr 出现的位置。如果没有找到，返回 0

## 语法

```sql
LOCATE ( <substr> , <str> [, <pos> ] )
```

## 参数

| 参数       | 说明              |
|----------|-----------------|
| `substr` | 需要查找的子字符串       |
| `str`    | 需要被查找的字符串       |
| `pos`    | 如果指定了此参数，则 str 以 pos 下标开始的字符串处开始查找 substr 出现的位置|

## 返回值

substr 在 str 中出现的位置（从 1 开始计数）

## 举例

```sql
SELECT locate('bar', 'foobarbar'),locate('xbar', 'foobar'),locate('bar', 'foobarbar', 5)
```

```text
+----------------------------+--------------------------+-------------------------------+
| locate('bar', 'foobarbar') | locate('xbar', 'foobar') | locate('bar', 'foobarbar', 5) |
+----------------------------+--------------------------+-------------------------------+
|                          4 |                        0 |                             7 |
+----------------------------+--------------------------+-------------------------------+
```