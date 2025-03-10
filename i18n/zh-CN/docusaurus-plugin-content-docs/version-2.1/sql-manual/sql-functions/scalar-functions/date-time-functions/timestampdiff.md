---
{
  "title": "TIMESTAMPDIFF",
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

`timestampdiff` 函数用于计算两个日期之间的差值，返回两个日期之间的时间间隔。可以计算两者之间的差异，以指定的时间单位（如秒、分钟、小时、天、月、年等）返回结果。

## 语法

`TIMESTAMPDIFF(<unit>, <datetime_expr1>, <datetime_expr2>)`

## 参数

| 参数 | 说明                                                        |
| -- |-----------------------------------------------------------|
| `unit` | 时间单位，指定要返回差异的单位，常见的值有 SECOND、MINUTE、HOUR、DAY、MONTH、YEAR 等 |
|`datetime_expr1`| 第一个日期时间，合法的日期格式                                           |
|`datetime_expr2`| 第二个日期时间，合法的日期格式                                           |

## 返回值

返回两个日期时间之间的差异，单位根据 unit 参数确定。

如果输入的参数不合法，则返回 `NULL`

## 举例

```sql
SELECT TIMESTAMPDIFF(MONTH,'2003-02-01','2003-05-01');
```

```text
+--------------------------------------------------------------------+
| timestampdiff(MONTH, '2003-02-01 00:00:00', '2003-05-01 00:00:00') |
+--------------------------------------------------------------------+
|                                                                  3 |
+--------------------------------------------------------------------+
```

```sql
SELECT TIMESTAMPDIFF(YEAR,'2002-05-01','2001-01-01');
```

```text
+-------------------------------------------------------------------+
| timestampdiff(YEAR, '2002-05-01 00:00:00', '2001-01-01 00:00:00') |
+-------------------------------------------------------------------+
|                                                                -1 |
+-------------------------------------------------------------------+
```

```sql
SELECT TIMESTAMPDIFF(MINUTE,'2003-02-01','2003-05-01 12:05:55');
```

```text
+---------------------------------------------------------------------+
| timestampdiff(MINUTE, '2003-02-01 00:00:00', '2003-05-01 12:05:55') |
+---------------------------------------------------------------------+
|                                                              128885 |
+---------------------------------------------------------------------+
```
```sql
SELECT  TIMESTAMPDIFF(MINUTE,'2003-02-01','1196440219');
```

```text
+-----------------------------------------------------------------------------------+
| timestampdiff(MINUTE, '2003-02-01 00:00:00', CAST('1196440219' AS datetimev2(6))) |
+-----------------------------------------------------------------------------------+
|                                                                              NULL |
+-----------------------------------------------------------------------------------+
```