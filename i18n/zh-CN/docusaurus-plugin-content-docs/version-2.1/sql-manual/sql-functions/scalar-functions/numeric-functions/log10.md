---
{
    "title": "LOG10",
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

返回以`10`为底的`x`的自然对数。

## 别名

- DLOG10

## 语法

```sql
LOG10(<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 真数 必须大于 0 |

## 返回值

返回一个浮点数。

- 当 x IS NULL：返回 `NULL`

## 举例

```sql
select log10(1);
```

```text
+--------------------------+
| log10(cast(1 as DOUBLE)) |
+--------------------------+
|                      0.0 |
+--------------------------+
```

```sql
select log10(10);
```

```text
+---------------------------+
| log10(cast(10 as DOUBLE)) |
+---------------------------+
|                       1.0 |
+---------------------------+
```

```sql
select log10(16);
```

```text
+---------------------------+
| log10(cast(16 as DOUBLE)) |
+---------------------------+
|        1.2041199826559248 |
+---------------------------+
```
