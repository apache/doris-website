---
{
    "title": "STARTS_WITH",
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

STARTS_WITH 函数检查字符串是否以指定的前缀开头。如果字符串以指定的前缀开头，则返回 true；否则返回 false。

## 语法

```sql
STARTS_WITH(<str>, <prefix>)
```

## 参数
| 参数 | 说明 |
| ------- | ------------------------------ |
| `<str>` | 要检查的字符串。类型：VARCHAR |
| `<prefix>` | 要匹配的前缀字符串。类型：VARCHAR |

## 返回值

返回 BOOLEAN 类型。

特殊情况：
- 如果任何参数为 NULL，则返回 NULL

## 举例

1. 匹配成功
```sql
SELECT starts_with('hello world', 'hello');
```
```text
+-------------------------------------+
| starts_with('hello world', 'hello') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
```

2. 匹配失败
```sql
SELECT starts_with('hello world', 'world');
```
```text
+-------------------------------------+
| starts_with('hello world', 'world') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```