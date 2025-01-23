---
{
    "title": "DATE_CEIL",
    "language": "en"
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

## Description

`date_ceil` rounds a given date to the next upper boundary of the specified time interval.

## Syntax

`DATE_CEIL(<datetime>, INTERVAL <period> <type>)`

## Parameters

| Parameter | Description |
| -- | -- |
| `datetime` | The argument is a valid date expression |
| `period` | The argument specifies how many units make up each period, with the start time being 0001-01-01T00:00:00 |
| `type` | The argument can be: YEAR, MONTH, DAY, HOUR, MINUTE, SECOND|

## Return Value

The return value is a date or time, representing the result of rounding the input value up to the specified unit.

## Examples

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