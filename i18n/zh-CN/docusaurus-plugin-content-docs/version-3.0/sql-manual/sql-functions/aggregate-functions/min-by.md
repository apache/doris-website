---
{
    "title": "MIN_BY",
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

MIN_BY 函数用于根据指定列的最小值，返回对应的的关联值。

## 语法

```sql
MIN_BY(<expr1>, <expr2>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 用于指定对应关联的表达式。 |
| `<expr2>` | 用于指定最小值统计的表达式。 |

## 返回值

返回与输入表达式 <expr1> 相同的数据类型。

## 举例
```sql
select * from tbl;
```

```text
+------+------+------+------+
| k1   | k2   | k3   | k4   |
+------+------+------+------+
|    0 | 3    | 2    |  100 |
|    1 | 2    | 3    |    4 |
|    4 | 3    | 2    |    1 |
|    3 | 4    | 2    |    1 |
+------+------+------+------+
```

```sql
select min_by(k1, k4) from tbl;
```

```text
+--------------------+
| min_by(`k1`, `k4`) |
+--------------------+
|                  4 |
+--------------------+ 
```
