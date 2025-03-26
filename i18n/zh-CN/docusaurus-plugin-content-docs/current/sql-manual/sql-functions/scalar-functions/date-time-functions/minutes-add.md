---
{
    "title": "MINUTES_ADD",
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

对指定日期时间增加指定的分钟数，并返回计算后的新日期时间

## 语法

```sql
MINUTES_ADD(<datetime/date>, <nums>)
```

## 参数

| 参数                | 说明            |
|-------------------|---------------|
| `<datetime/date>` | 需要被计算的日期时间值，类型为 `DATETIME` 或 `DATE` |
| `<nums>`          | 需要增加的分钟数 |

## 返回值

返回计算后的新日期

返回值与输入的 <datetime/date> 类型一致。

特殊情况：

- <datetime/date> 输入为 NULL 时，返回 NULL
- 如果计算结果越界，SQL 执行将会报错。在过滤条件中可以改写为 [`TIMESTAMPDIFF`](./timestampdiff)

## 举例

```sql
select minutes_add("2020-01-31 02:02:02", 1),minutes_add("2020-01-31", 1),minutes_add("2020-01-31", -1);
```

```text
+---------------------------------------+------------------------------+-------------------------------+
| minutes_add("2020-01-31 02:02:02", 1) | minutes_add("2020-01-31", 1) | minutes_add("2020-01-31", -1) |
+---------------------------------------+------------------------------+-------------------------------+
| 2020-01-31 02:03:02                   | 2020-01-31 00:01:00          | 2020-01-30 23:59:00           |
+---------------------------------------+------------------------------+-------------------------------+
```

```sql
select minutes_add("9999-12-31 12:00:00", 1000);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [E-218] Operation minutes_add of 9999-12-31 12:00:00, 1000 out of range
```
