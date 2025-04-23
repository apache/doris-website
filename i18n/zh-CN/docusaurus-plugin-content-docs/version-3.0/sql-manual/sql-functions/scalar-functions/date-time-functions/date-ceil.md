---
{
    "title": "DATE_CEIL",
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

`date_ceil` 将日期转化为指定的时间间隔周期的最近上取整时刻。

## 语法

`DATE_CEIL(<datetime>, INTERVAL <period> <type>)`

## 参数

| 参数 | 说明 |
| -- | -- |
| `datetime` | 参数是合法的日期表达式 |
| `period` | 参数是指定每个周期有多少个单位组成，开始的时间起点为 0001-01-01T00:00:00 |
| `type` | 参数可以是：YEAR, MONTH, DAY, HOUR, MINUTE, SECOND |

## 返回值

返回的是一个日期或时间值，表示将输入值向上舍入到指定单位的结果。

## 举例

```sql
select date_ceil("2023-07-13 22:28:18",interval 5 second);
```

```text
+--------------------------------------------------------------+
| second_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+--------------------------------------------------------------+
| 2023-07-13 22:28:20                                          |
+--------------------------------------------------------------+
```

```sql
select date_ceil("2023-07-13 22:28:18",interval 5 minute);
+--------------------------------------------------------------+
| minute_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+
```

```sql
select date_ceil("2023-07-13 22:28:18",interval 5 hour);
```

```text
+------------------------------------------------------------+
| hour_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+------------------------------------------------------------+
| 2023-07-13 23:00:00                                        |
+------------------------------------------------------------+
```

```sql
select date_ceil("2023-07-13 22:28:18",interval 5 day);
```

```text
+-----------------------------------------------------------+
| day_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-----------------------------------------------------------+
| 2023-07-15 00:00:00                                       |
+-----------------------------------------------------------+
```

```sql
select date_ceil("2023-07-13 22:28:18",interval 5 month);
```

```text
+-------------------------------------------------------------+
| month_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-------------------------------------------------------------+
| 2023-12-01 00:00:00                                         |
+-------------------------------------------------------------+
```

```sql
select date_ceil("2023-07-13 22:28:18",interval 5 year);
```

```text
+------------------------------------------------------------+
| year_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+------------------------------------------------------------+
| 2026-01-01 00:00:00                                        |
+------------------------------------------------------------+
```
