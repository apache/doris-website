---
{
  "title": "TIMESTAMPADD",
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

The `timestampadd` function is used to add a specified time unit (such as year, month, day, hour, minute, second, etc.) to a date. This function is commonly used for date and time calculations.

## Syntax

`TIMESTAMPADD(<unit>, <interval>, <datetime_expr>)`

## Parameters

| Parameter | Description                                                                                                          |
| -- |----------------------------------------------------------------------------------------------------------------------|
| `unit` | Time unit, specifies the time unit to add, common values include SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR        |
| `interval` | The time interval to add, typically an integer, which can be positive or negative to add or subtract the time length |
| `datetime_expr` | A valid  datetime data type                                                                                          |

## Return Value

The return value is the new date and time, representing the result of adding or subtracting the specified time interval to the given timestamp.

If the input parameters are invalid, `NULL` is returned.

## Examples

```sql
SELECT TIMESTAMPADD(MINUTE,1,'2019-01-02');
```

```text
+------------------------------------------------+
| timestampadd(MINUTE, 1, '2019-01-02 00:00:00') |
+------------------------------------------------+
| 2019-01-02 00:01:00                            |
+------------------------------------------------+
```

```sql
SELECT TIMESTAMPADD(WEEK,1,'2019-01-02');
```

```text
+----------------------------------------------+
| timestampadd(WEEK, 1, '2019-01-02 00:00:00') |
+----------------------------------------------+
| 2019-01-09 00:00:00                          |
+----------------------------------------------+
```

```sql
SELECT TIMESTAMPADD(WEEK,1,'1196440219');
```

```sql
+------------------------------------------------------------+
| timestampadd(WEEK, 1, CAST('1196440219' AS datetimev2(6))) |
+------------------------------------------------------------+
| NULL                                                       |
+------------------------------------------------------------+
```
