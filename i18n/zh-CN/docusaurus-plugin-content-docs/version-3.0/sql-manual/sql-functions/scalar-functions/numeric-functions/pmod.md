---
{
    "title": "PMOD",
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

返回模运算 x mod y 在模系中的最小正数解，即通过计算 (x % y + y) % y 得出结果。

## 语法

```sql
PMOD(<x> , <y>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 被除数 |
| `<y>` | 除数 不能为 0 |

## 返回值

返回一个整型或浮点数。特殊情况：

- 当 x=0 时，返回 0。
- 当 x is NULL 或 y is NULL 时，返回 NULL。

## 举例

```sql
SELECT PMOD(13,5);
```

```text
+-------------+
| pmod(13, 5) |
+-------------+
|           3 |
+-------------+
```

```sql
SELECT PMOD(-13,5);
```

```text
+--------------+
| pmod(-13, 5) |
+--------------+
|            2 |
+--------------+
```

```sql
SELECT PMOD(0,-12);
```

```text
+--------------+
| pmod(0, -12) |
+--------------+
|            0 |
+--------------+
```

```sql
SELECT PMOD(0,null);
```

```text
+-------------------------------+
| pmod(cast(0 as DOUBLE), NULL) |
+-------------------------------+
|                          NULL |
+-------------------------------+
```