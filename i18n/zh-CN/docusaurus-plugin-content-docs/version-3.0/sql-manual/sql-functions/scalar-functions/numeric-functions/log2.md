---
{
    "title": "LOG2",
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

返回以`2`为底的`x`的自然对数。

## 语法

```sql
LOG2(<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 真数 should be greater than 0 |

## 返回值

返回一个浮点数。特殊情况：

- 当 x 为 NULL 时，返回 `NULL`

## 举例

```sql
select log2(1);
```

```text
+-------------------------+
| log2(cast(1 as DOUBLE)) |
+-------------------------+
|                     0.0 |
+-------------------------+
```

```sql
select log2(2);
```

```text
+-------------------------+
| log2(cast(2 as DOUBLE)) |
+-------------------------+
|                     1.0 |
+-------------------------+
```

```sql
select log2(10);
```

```text
+--------------------------+
| log2(cast(10 as DOUBLE)) |
+--------------------------+
|       3.3219280948873626 |
+--------------------------+
```
