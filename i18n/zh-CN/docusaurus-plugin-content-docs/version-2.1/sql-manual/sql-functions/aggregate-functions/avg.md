---
{
"title": "AVG",
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

计算指定列或表达式的所有非 NULL 值的平均值。

## 语法

```sql
AVG([DISTINCT] <expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 是一个表达式或列，通常是一个数值列或者能够转换为数值的表达式 |
| `[DISTINCT]` | 是一个可选的关键字，表示对 expr 中的重复值进行去重后再计算平均值 |

## 返回值

返回所选列或表达式的平均值，如果组内的所有记录均为 NULL，则该函数返回 NULL

## 举例

```sql
SELECT datetime, AVG(cost_time) FROM log_statis group by datetime;
```

```text
+---------------------+--------------------+
| datetime            | avg(`cost_time`)   |
+---------------------+--------------------+
| 2019-07-03 21:01:20 | 25.827794561933533 |
+---------------------+--------------------+
```

```sql
SELECT datetime, AVG(distinct cost_time) FROM log_statis group by datetime;
```

```text
+---------------------+---------------------------+
| datetime            | avg(DISTINCT `cost_time`) |
+---------------------+---------------------------+
| 2019-07-04 02:23:24 |        20.666666666666668 |
+---------------------+---------------------------+
```
