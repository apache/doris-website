---
{
    "title": "COUNT_SUBSTRINGS",
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

COUNT_SUBSTRINGS 函数用于计算一个字符串中指定子串出现的次数。注意：当前实现在每次匹配到子串时，会偏移一个子串长度继续查找。例如，当 str='ccc' 且 pattern='cc' 时，返回结果为 1。

## 语法

```sql
COUNT_SUBSTRINGS(<str>, <pattern>)
```

## 参数
| 参数    | 说明                           |
| ------- | ------------------------------ |
| `<str>`     | 需要检测的字符串。类型：STRING |
| `<pattern>` | 需要匹配的子串。类型：STRING   |

## 返回值

返回 INT 类型，表示子串在字符串中出现的次数。

特殊情况：
- 如果 str 为 NULL，返回 NULL
- 如果 pattern 为空字符串，返回 0
- 如果 str 为空字符串，返回 0

## 示例

1. 基本用法
```sql
SELECT count_substrings('a1b1c1d', '1');
```
```text
+----------------------------------+
| count_substrings('a1b1c1d', '1') |
+----------------------------------+
|                                3 |
+----------------------------------+
```

2. 连续逗号的情况
```sql
SELECT count_substrings(',,a,b,c,', ',');
```
```text
+-----------------------------------+
| count_substrings(',,a,b,c,', ',') |
+-----------------------------------+
|                                 5 |
+-----------------------------------+
```

3. 重叠子串的情况
```sql
SELECT count_substrings('ccc', 'cc');
```
```text
+--------------------------------+
| count_substrings('ccc', 'cc')  |
+--------------------------------+
|                              1 |
+--------------------------------+
```

4. NULL 值处理
```sql
SELECT count_substrings(NULL, ',');
```
```text
+-----------------------------+
| count_substrings(NULL, ',') |
+-----------------------------+
|                        NULL |
+-----------------------------+
```

5. 空字符串处理
```sql
SELECT count_substrings('a,b,c,abcde', '');
```
```text
+-------------------------------------+
| count_substrings('a,b,c,abcde', '') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```
