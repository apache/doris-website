---
{
    "title": "SPLIT_PART",
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

用于将一个字符串按照指定的分隔符拆分成多个部分，并返回其中的一个部分。

## 语法

```sql
SPLIT_PART ( <str>, <separator>, <part_index> )
```

## 参数

| 参数             | 说明       |
|----------------|----------|
| `<str>`        | 需要分割的字符串 |
| `<separator>`  | 用于分割的字符串 |
| `<part_index>` | 要返回的部分的索引，从 1 开始计数 |

## 返回值

返回根据分割符拆分后的字符串的指定部分。特殊情况：

- 任意两个参数中有一个为 NULL，则返回 NULL
- 当`<part_index>`为 0 时，返回 NULL

## 举例

```sql
select split_part("hello world", " ", 1);
```

```text
+----------------------------------+
| split_part('hello world', ' ', 1) |
+----------------------------------+
| hello                            |
+----------------------------------+
```

```sql
SELECT split_part('apple,banana,cherry', ',', 0);
```

```text
+-------------------------------------------+
| split_part('apple,banana,cherry', ',', 0) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
