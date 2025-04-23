---
{
    "title": "MONTH_FLOOR",
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

Rounds down a datetime value to the nearest specified month interval. If a starting time (origin) is provided, it uses that time as the reference for calculating the interval.

## Syntax

```sql
MONTH_FLOOR(<datetime>)
MONTH_FLOOR(<datetime>, <origin>)
MONTH_FLOOR(<datetime>, <period>)
MONTH_FLOOR(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<datetime>`  | The datetime value to round down, of type DATETIME or DATETIMEV2 |
| `<period>`    | The month interval value, of type INT, representing the number of months in each interval |
| `<origin>`    | The starting point for the interval, of type DATETIME or DATETIMEV2; defaults to 0001-01-01 00:00:00 |

## Return Value

Returns a value of type DATETIME, representing the rounded-down datetime value. The time portion of the result will be set to 00:00:00.

## Example

```sql
SELECT MONTH_FLOOR("2023-07-13 22:28:18", 5);
```

```text
+--------------------------------------------------------------+
| month_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-05-01 00:00:00                                          |
+--------------------------------------------------------------+
```

**Note:**
- If no period is specified, it defaults to a 1-month interval.
- The period must be a positive integer.
- The result is always rounded down to a past time.
- The time portion of the returned value is always set to 00:00:00.
- Unlike MONTH_CEIL, MONTH_FLOOR always discards the portion that exceeds the interval.

## Best Practices

See also [date_floor](./date-floor)
