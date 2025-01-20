---
{
    "title": "STRLEFT",
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

STRLEFT 函数用于返回字符串左边指定长度的部分。长度的单位为 UTF8 字符。

## 别名

LEFT

## 语法

```sql
STRLEFT(VARCHAR <str>, INT <len>)
```

## 参数
| 参数 | 说明 |
| ------- | ----------------------------------------- |
| `<str>` | 需要截取的字符串。类型：VARCHAR |
| `<len>` | 要返回的字符数量。类型：INT |

## 返回值

返回 VARCHAR 类型，表示截取的字符串。

特殊情况：
- 如果任意参数为 NULL，返回 NULL
- 如果 len 小于等于 0，返回空字符串 ""
- 如果 len 大于字符串长度，返回整个字符串

## 示例

1. 基本用法
```sql
SELECT strleft('Hello doris', 5);
```
```text
+------------------------+
| strleft('Hello doris', 5) |
+------------------------+
| Hello                  |
+------------------------+
```

2. 负数长度处理
```sql
SELECT strleft('Hello doris', -5);
```
```text
+----------------------------+
| strleft('Hello doris', -5) |
+----------------------------+
|                            |
+----------------------------+
```

3. NULL 参数处理
```sql
SELECT strleft('Hello doris', NULL);
```
```text
+------------------------------+
| strleft('Hello doris', NULL) |
+------------------------------+
| NULL                         |
+------------------------------+
```

4. NULL 字符串处理
```sql
SELECT strleft(NULL, 3);
```
```text
+------------------+
| strleft(NULL, 3) |
+------------------+
| NULL             |
+------------------+
```