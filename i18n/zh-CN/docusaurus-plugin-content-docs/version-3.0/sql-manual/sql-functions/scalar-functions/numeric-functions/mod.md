---
{
    "title": "MOD",
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

求整数类型，a / b的余数，浮点类型请使用fmod函数。

## 语法

```sql
MOD(<col_a> , <col_b>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col_a>` | 被除数 |
| `<col_b>` | 除  数 不能为0|

## 返回值

返回一个整型。特殊情况：

- 当 col_a 为 `NULL` 或 col_b 为 `NULL`时，返回 `NULL`

## 举例

```sql
select mod(10, 3);
```

```text
+----------+
| (10 % 3) |
+----------+
|        1 |
+----------+
```

```sql
select mod(10, 0);
```

```text
+----------+
| (10 % 0) |
+----------+
|     NULL |
+----------+
```
