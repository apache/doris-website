---
{
"title": "SUBSTRING_INDEX",
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

SUBSTRING_INDEX 函数用于截取字符串，根据指定的分隔符和出现次数来确定截取位置。该函数支持从左边或右边开始计数。

## 语法

```sql
SUBSTRING_INDEX(<content>, <delimiter>, <field>)
```

## 参数
| 参数      | 说明                                                    |
| --------- | ------------------------------------------------------- |
| `<content>` | 需要截取的字符串。类型：VARCHAR                         |
| `<delimiter>` | 分隔符，大小写敏感且多字节安全。类型：VARCHAR           |
| `<field>` | 分隔符出现的次数。正数从左计数，负数从右计数。类型：INT |

## 返回值

返回 VARCHAR 类型，表示截取后的子字符串。

特殊情况：
- 如果 field > 0，返回从左边起第 field 个分隔符之前的子串
- 如果 field < 0，返回从右边起第 |field| 个分隔符之后的子串
- 如果 field = 0，当 content 不为 NULL 时返回空串，content 为 NULL 时返回 NULL
- 如果任意参数为 NULL，返回 NULL

## 示例

1. 从左边截取第一个空格之前的内容
```sql
SELECT substring_index('hello world', ' ', 1);
```
```text
+----------------------------------------+
| substring_index('hello world', ' ', 1) |
+----------------------------------------+
| hello                                  |
+----------------------------------------+
```

2. 从左边截取所有内容（分隔符次数大于实际出现次数）
```sql
SELECT substring_index('hello world', ' ', 2);
```
```text
+----------------------------------------+
| substring_index('hello world', ' ', 2) |
+----------------------------------------+
| hello world                            |
+----------------------------------------+
```

3. 从右边截取最后一个空格之后的内容
```sql
SELECT substring_index('hello world', ' ', -1);
```
```text
+-----------------------------------------+
| substring_index('hello world', ' ', -1) |
+-----------------------------------------+
| world                                   |
+-----------------------------------------+
```

4. field 为 0 的情况
```sql
SELECT substring_index('hello world', ' ', 0);
```
```text
+----------------------------------------+
| substring_index('hello world', ' ', 0) |
+----------------------------------------+
|                                        |
+----------------------------------------+
```