---
{
    "title": "POSITIVE",
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

返回数值本身。

## 语法

```sql
POSITIVE(<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 需要返回的数值 |

## 返回值

返回一个整型或者浮点数。特殊情况：

- 当 x is NULL 时，返回 NULL

## 举例

```sql
SELECT positive(-10);
```

```text
+---------------+
| positive(-10) |
+---------------+
|           -10 |
+---------------+
```

```sql
SELECT positive(10.111);
```

```text
+------------------+
| positive(10.111) |
+------------------+
|           10.111 |
+------------------+
```

```sql
SELECT positive(12);
```

```text
+--------------+
| positive(12) |
+--------------+
|           12 |
+--------------+
```

```sql
SELECT positive(null);
```

```text
+----------------+
| positive(NULL) |
+----------------+
|           NULL |
+----------------+
```