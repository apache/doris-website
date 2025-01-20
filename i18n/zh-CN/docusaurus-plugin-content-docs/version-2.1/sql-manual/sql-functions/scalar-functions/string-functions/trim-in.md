---
{
    "title": "TRIM_IN",
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

TRIM_IN 函数用于移除字符串两端的指定字符。当不指定移除字符集合时，默认移除两端的空格；当指定字符集合时，将移除两端出现的所有指定字符（不考虑字符集合顺序）。
TRIM_IN的特点是会移除指定字符集合中的任意字符组合，而TRIM函数则是按照完整的字符串匹配进行移除。

## 语法

```sql
TRIM_IN(VARCHAR <str> [, VARCHAR <rhs>])
```

## 参数
| 参数 | 说明                                      |
| ---- | ----------------------------------------- |
| `<str>` | 需要处理的字符串。类型：VARCHAR           |
| `<rhs>` | 可选参数，要移除的字符集合。类型：VARCHAR |

## 返回值

返回 VARCHAR 类型，表示处理后的字符串。

特殊情况：
- 如果 str 为 NULL，返回 NULL
- 如果不指定 rhs，移除两端所有空格
- 如果指定 rhs，移除两端出现在 rhs 中的所有字符，直到遇到第一个不在 rhs 中的字符

## 示例

1. 移除字符串两端的空格：
```sql
SELECT trim_in(' hello ');
```
```text
+------+
| str  |
+------+
| hello|
+------+
```

2. 移除指定字符集合中的字符：
```sql
-- TRIM_IN会移除字符串两端的'c'、'd'、'e'中的任意字符
SELECT trim_in('abcd', 'cde');
```
```text
+------+
| str  |
+------+
| ab   |
+------+
```

3. 与 TRIM 函数的对比
```sql
SELECT trim_in('abcd', 'cde'),trim('abcd', 'cde');
```
```text
+------------------------+---------------------+
| trim_in('abcd', 'cde') | trim('abcd', 'cde') |
+------------------------+---------------------+
| ab                     | abcd                |
+------------------------+---------------------+
```