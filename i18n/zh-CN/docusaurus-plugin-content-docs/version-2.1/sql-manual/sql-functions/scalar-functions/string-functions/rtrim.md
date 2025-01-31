---
{
    "title": "RTRIM",
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

RTRIM 函数用于去除字符串右侧（结尾部分）连续出现空格或指定字符。

## 语法

```sql
RTRIM( <str> [, <trim_chars> ] )
```

## 参数

| 参数             | 说明                                                                                             |
|----------------|------------------------------------------------------------------------------------------------|
| `<str>`        | 需要被修建的字符串                                                                                      |
| `<trim_chars>` | 可选参数。如果提供了该参数，RTRIM 函数将去除`<str>`右侧出现的`<trim_chars>`中的所有字符。如果未提供此参数，RTRIM 函数将仅去除`<str>`右侧的空格字符。 |

## 返回值

返回`<str>`右侧去除`<trim_chars>`后的字符串。特殊情况：

- 任意参数中有一个为 NULL，则返回 NULL

## 举例

```sql
SELECT rtrim('ab d   ') str;
```

```text
+------+
| str  |
+------+
| ab d |
+------+
```

```sql
SELECT rtrim('ababccaab','ab') str;
```

```text
+---------+
| str     |
+---------+
| ababcca |
+---------+
```
