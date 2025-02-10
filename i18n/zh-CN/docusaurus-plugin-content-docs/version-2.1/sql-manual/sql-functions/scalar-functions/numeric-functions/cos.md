---
{
    "title": "COS",
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

计算参数的余弦值

## 语法

```sql
COS(<a>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>` | 浮点数，要计算参数的弧度值 |

## 返回值

参数 `<a>` 的余弦值，弧度制表示。

## 举例

```sql
select cos(1);
```

```text
+---------------------+
| cos(1.0)            |
+---------------------+
| 0.54030230586813977 |
+---------------------+
```

```sql
select cos(0);
```

```text
+------------------------+
| cos(cast(0 as DOUBLE)) |
+------------------------+
|                    1.0 |
+------------------------+
```

```sql
select cos(Pi());
```

```text
+-----------+
| cos(pi()) |
+-----------+
|        -1 |
+-----------+
```
