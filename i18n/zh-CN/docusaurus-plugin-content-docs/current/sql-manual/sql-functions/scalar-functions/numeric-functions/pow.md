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

用于计算`a`的`b`次幂

## 别名

- POWER
- FPOW
- DPOW

## 语法

```sql
POW(<a> , <b>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>`   | Base   |
| `<b>`   | Power  |

## 返回值

返回一个整型或浮点数。特殊情况：

- 当`a`或`b`为`NULL`时，返回`NULL`。
- 当b = 0 且 a不为`NULL`时，永远返回1

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

