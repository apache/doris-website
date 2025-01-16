---
{
    "title": "MINUTE_CEIL",
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

Rounds up a datetime value to the nearest specified minute interval. If a starting time (origin) is provided, it uses that time as the reference for calculating the interval.

## Syntax

```sql
DATETIME MINUTE_CEIL(DATETIME datetime)
DATETIME MINUTE_CEIL(DATETIME datetime, DATETIME origin)
DATETIME MINUTE_CEIL(DATETIME datetime, INT period)
DATETIME MINUTE_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| datetime  | The datetime value to round up, of type DATETIME or DATETIMEV2 |
| period    | The minute interval value, of type INT, representing the number of minutes in each interval |
| origin    | The starting point for the interval, of type DATETIME or DATETIMEV2; defaults to 0001-01-01 00:00:00 |

## Return Value

Returns a value of type DATETIMEV2, representing the rounded-up datetime value.

## Example

```sql
SELECT MINUTE_CEIL("2023-07-13 22:28:18", 5);
```

```text
+--------------------------------------------------------------+
| minute_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+
```

**Note:**
- If no period is specified, it defaults to a 1-minute interval.
- The period must be a positive integer.
- The result is always rounded up to a future time.

## Keywords

    MINUTE_CEIL, MINUTE, CEIL

## Best Practices

See also [date_ceil](./date_ceil)
