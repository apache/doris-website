---
{
    "title": "INSTR",
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

返回 substr 在 str 中第一次出现的位置（从1开始计数）。特殊情况：

- 如果 substr 不在 str 中出现，则返回0。

## 语法

```sql
INSTR ( <str> , <substr> )
```

## 参数

|参数     | 说明        |
|-------|-----------|
| `<str>`  | 需要查找的字符串  |
| `<substr>` | 需要被查找的字符串 |

## 返回值

参数 `<substr>` 在 `<str>` 中第一次出现的位置（从1开始计数）。特殊情况：

- 如果 `<substr>` 不在 `<str>` 中出现，则返回0。

## 举例

```sql
SELECT INSTR("abc", "b"),INSTR("abc", "d")
```

```text
+-------------------+-------------------+
| instr('abc', 'b') | instr('abc', 'd') |
+-------------------+-------------------+
|                 2 |                 0 |
+-------------------+-------------------+
```