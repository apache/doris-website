---
{
    "title": "SUBSTRING_FOR_ZERO",
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

SUBSTRING_FOR_ZERO 函数用于从字符串中提取子字符串。可以指定起始位置和长度，支持正向和反向提取。字符串中第一个字符的位置为 1。

## 别名

SUBSTR_FOR_ZERO

## 语法

```sql
SUBSTRING_FOR_ZERO(<str>, <pos> [, <len>])
```

## 参数
| 参数 | 说明                              |
| ------- | --------------------------------- |
| `<str>` | 源字符串。类型：VARCHAR           |
| `<pos>` | 起始位置，可以为负数。类型：INT   |
| `<len>` | 可选参数，要提取的长度。类型：INT |

## 返回值

返回 VARCHAR 类型，表示提取的子字符串。

特殊情况：
- 如果任意参数为 NULL，返回 NULL
- 如果 pos 为 0，看作 pos 为 1
- 如果 pos 为负数，从字符串末尾开始向前计数
- 如果 pos 超出字符串长度，返回空字符串
- 如果不指定 len，则返回从 pos 到字符串末尾的所有字符

## 示例

1. 基本用法（指定起始位置）
```sql
SELECT substring_for_zero('abc1', 2);
```
```text
+-------------------------------+
| substring_for_zero('abc1', 2) |
+-------------------------------+
| bc1                           |
+-------------------------------+
```

2. 使用负数位置
```sql
SELECT substring_for_zero('abc1', -2);
```
```text
+--------------------------------+
| substring_for_zero('abc1', -2) |
+--------------------------------+
| c1                             |
+--------------------------------+
```

3. 位置为 0 的情况
```sql
SELECT substring_for_zero('abc1', 0);
```
```text
+-------------------------------+
| substring_for_zero('abc1', 0) |
+-------------------------------+
| abc1                          |
+-------------------------------+
```

4. 位置超出字符串长度
```sql
SELECT substring_for_zero('abc1', 5);
```
```text
+-------------------------------+
| substring_for_zero('abc1', 5) |
+-------------------------------+
|                               |
+-------------------------------+
```

5. 指定长度参数
```sql
SELECT substring_for_zero('abc1def', 2, 2);
```
```text
+-------------------------------------+
| substring_for_zero('abc1def', 2, 2) |
+-------------------------------------+
| bc                                  |
+-------------------------------------+
```

**注意：**

该函数与 SUBSTRING 函数类似，唯一的区别在于当位置参数为 0 时，将其视为位置 1。该函数旨在与 Hive 的 SUBSTRING 函数行为兼容。