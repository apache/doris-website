---
{
    "title": "STRCMP",
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

STRCMP 函数用于按照字典顺序比较两个字符串。该函数将返回一个整数值来表示两个字符串的比较结果。

## 语法

```sql
STRCMP(<str0>, <str1>)
```

## 参数
| 参数 | 说明 |
| ------- | ----------------------------------------- |
| `<str0>` | 第一个要比较的字符串。类型：VARCHAR |
| `<str1>` | 第二个要比较的字符串。类型：VARCHAR |

## 返回值

返回 TINYINT 类型，表示比较结果：
- 返回 0：如果 str0 和 str1 相同
- 返回 1：如果 str0 在字典顺序上大于 str1
- 返回 -1：如果 str0 在字典顺序上小于 str1

特殊情况：
- 如果任意参数为 NULL，返回 NULL

## 示例

1. 相同字符串比较
```sql
SELECT strcmp('test', 'test');
```
```text
+------------------------+
| strcmp('test', 'test') |
+------------------------+
|                      0 |
+------------------------+
```

2. 第一个字符串较大
```sql
SELECT strcmp('test1', 'test');
```
```text
+-------------------------+
| strcmp('test1', 'test') |
+-------------------------+
|                       1 |
+-------------------------+
```

3. 第一个字符串较小
```sql
SELECT strcmp('test', 'test1');
```
```text
+-------------------------+
| strcmp('test', 'test1') |
+-------------------------+
|                      -1 |
+-------------------------+
```
