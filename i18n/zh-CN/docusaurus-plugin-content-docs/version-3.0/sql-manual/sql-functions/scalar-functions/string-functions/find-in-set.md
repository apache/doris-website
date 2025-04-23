---
{
    "title": "FIND_IN_SET",
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

返回 strlist 中第一次出现 str 的位置（从 1 开始计数）。

strlist 是用逗号分隔的字符串。特殊情况：

- 如果没有找到，返回 0。
- 任一参数为 NULL，返回 NULL。

## 语法

```sql
FIND_IN_SET ( <str> , <strlist> )
```

## 参数

| 参数          | 说明       |
|-------------|----------|
| `<str>`     | 需要查找的字符串 |
| `<strlist>` | 需要被查找的字符串 |

## 返回值

参数 `<str>` 在参数 `<strlist>` 第一次出现的位置。特殊情况：
- 如果没有找到，返回 0。
- 任一参数为 NULL，返回 NULL。

## 举例

```sql
SELECT FIND_IN_SET("b", "a,b,c")
```

```text
| find_in_set('b', 'a,b,c') |
+---------------------------+
|                         2 |
+---------------------------+
```