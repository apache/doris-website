---
{
    "title": "EXP",
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

返回以`e`为底的`x`的幂。

## 别名

- DEXP

## 语法

```sql
EXP(<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 自变量 |

## 返回值

返回一个 double。特殊情况：

- 当参数为`NULL`时，返回 NULL

## 举例

```sql
select exp(2);
```

```text
+------------------+
| exp(2.0)         |
+------------------+
| 7.38905609893065 |
+------------------+
```

```sql
select exp(3.4);
```

```text
+--------------------+
| exp(3.4)           |
+--------------------+
| 29.964100047397011 |
+--------------------+
```
