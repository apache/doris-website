---
{
    "title": "TIMESTAMP",
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

Converts a date or date-time expression to a standard date-time format.


## Syntax

```sql
TIMESTAMP(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The date or date-time expression that needs to be converted |

## Return Value

Return a date-time value in the format YYYY-MM-DD HH:MM:SS.

## Examples

```sql
SELECT  date '2012-08-08' + interval '2' day,
            timestamp '2012-08-08 01:00' + interval '29' hour,
            timestamp '2012-10-31 01:00' + interval '1' month,
            date '2012-08-08' - interval '2' day,
            timestamp '2012-08-08 01:00' - interval '29' hour,
            timestamp '2012-10-31 01:00' - interval '1' month
```

```text
+-------------------------------------------------------+-------------------------------------------------------------------+--------------------------------------------------------------------+-------------------------------------------------------+-------------------------------------------------------------------+--------------------------------------------------------------------+
| days_add('2012-08-08', INTERVAL cast('2' as INT) DAY) | hours_add('2012-08-08 01:00:00', INTERVAL cast('29' as INT) HOUR) | months_add('2012-10-31 01:00:00', INTERVAL cast('1' as INT) MONTH) | days_sub('2012-08-08', INTERVAL cast('2' as INT) DAY) | hours_sub('2012-08-08 01:00:00', INTERVAL cast('29' as INT) HOUR) | months_sub('2012-10-31 01:00:00', INTERVAL cast('1' as INT) MONTH) |
+-------------------------------------------------------+-------------------------------------------------------------------+--------------------------------------------------------------------+-------------------------------------------------------+-------------------------------------------------------------------+--------------------------------------------------------------------+
| 2012-08-10                                            | 2012-08-09 06:00:00                                               | 2012-11-30 01:00:00                                                | 2012-08-06                                            | 2012-08-06 20:00:00                                               | 2012-09-30 01:00:00                                                |
+-------------------------------------------------------+-------------------------------------------------------------------+--------------------------------------------------------------------+-------------------------------------------------------+-------------------------------------------------------------------+--------------------------------------------------------------------+
```