---
{
    "title": "TRIM",
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

用于删除字符串两端的空格或指定字符，当没有 rhs 参数时，将参数 str 中右侧和左侧开始部分连续出现的空格去掉，否则去掉 rhs

## 语法

```sql
RTIM( <str> [ , <rhs>])
```
## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 删除该字符串两端的空格 |


## 可选参数

| 参数 | 描述 |
|------|------|
| `<rhs>` | 去掉该指定字符 |

## 返回值

删除两端的空格或指定字符后的字符串


## 示例

```sql
SELECT trim('   ab d   ') str;
```
```sql

+------+
| str  |
+------+
| ab d |
+------+
```

```sql
SELECT trim('ababccaab','ab') str;
```

```sql
+------+
| str  |
+------+
| cca  |
+------+
```

