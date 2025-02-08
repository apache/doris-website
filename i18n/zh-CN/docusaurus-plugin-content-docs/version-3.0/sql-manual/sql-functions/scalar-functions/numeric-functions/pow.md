---
{
    "title": "POW",
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

用于计算 `a` 的 `b` 次方。

## 别名

- POWER
- FPOW
- DPOW

## 语法

```sql
POW(<a>, <b>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>`   | 基数   |
| `<b>`   | 指数  |

## 返回值

返回参数 `a` 的 `b` 次方。

特殊情况：

- 当 `a` 或 `b` 为 `NULL` 时，返回 `NULL`。
- 当 `b = 0` 且 `a` 不为 `NULL` 时，永远返回 `1`。

## 示例

```sql
select pow(2, 0);
```
```text
+-------------------------------------------+
| pow(cast(2 as DOUBLE), cast(0 as DOUBLE)) |
+-------------------------------------------+
|                                         1 |
+-------------------------------------------+
```

```sql
select pow(2, 10);
```
```text
+--------------------------------------------+
| pow(cast(2 as DOUBLE), cast(10 as DOUBLE)) |
+--------------------------------------------+
|                                       1024 |
+--------------------------------------------+
```

```sql
select pow(1.2, 2);
```
```text
+---------------------------------------------+
| pow(cast(1.2 as DOUBLE), cast(2 as DOUBLE)) |
+---------------------------------------------+
|                                        1.44 |
+---------------------------------------------+
```

```sql
select pow(1.2, 2.1);
```
```text
+-----------------------------------------------+
| pow(cast(1.2 as DOUBLE), cast(2.1 as DOUBLE)) |
+-----------------------------------------------+
|                            1.4664951016517147 |
+-----------------------------------------------+
```

```sql
select pow(2, null);
```
```text
+------------------------------+
| pow(cast(2 as DOUBLE), NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```

```sql
select pow(null, 2);
```
```text
+------------------------------+
| pow(NULL, cast(2 as DOUBLE)) |
+------------------------------+
|                         NULL |
+------------------------------+
```
