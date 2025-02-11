---
{
    "title": "SIN",
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

计算参数的正弦值

## 语法

```sql
SIN(<a>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>` | 浮点数，要计算参数的弧度值 |

## 返回值

参数 `<a>` 的正弦值，弧度制表示。

## 语法

```sql
SIN(<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 弧度值 |

## 返回值

返回浮点数。特殊情况：

- 当 x is NULL 时，返回 NULL.

## 举例

```sql
select sin(1);
```

```text
+------------------------+
| sin(cast(1 as DOUBLE)) |
+------------------------+
|     0.8414709848078965 |
+------------------------+
```

```sql
select sin(0);
```

```text
+------------------------+
| sin(cast(0 as DOUBLE)) |
+------------------------+
|                    0.0 |
+------------------------+
```

```sql
select sin(Pi());
```

```text
+------------------------------------+
| sin(pi())                          |
+------------------------------------+
| 0.00000000000000012246467991473532 |
+------------------------------------+
```
