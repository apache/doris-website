---
{
    "title": "MICROSECONDS_DIFF",
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

Calculates the microsecond difference between two datetime values. The result is the number of microseconds from startdate subtracted from enddate.

## Syntax

```sql
INT MICROSECONDS_DIFF(DATETIMEV2 enddate, DATETIMEV2 startdate)
```

## Parameters

| Parameter  | Description                                     |
|------------|-------------------------------------------------|
| enddate    | The end time, of type DATETIMEV2               |
| startdate  | The start time, of type DATETIMEV2             |

## Return Value

Returns an INT type representing the microsecond difference between the two times.
- Returns a positive number if enddate is greater than startdate.
- Returns a negative number if enddate is less than startdate.
- 1 second = 1,000,000 microseconds.

## Example

```sql
SELECT MICROSECONDS_DIFF('2020-12-25 21:00:00.623000', '2020-12-25 21:00:00.123000');
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| microseconds_diff(cast('2020-12-25 21:00:00.623000' as DATETIMEV2(3)), cast('2020-12-25 21:00:00.123000' as DATETIMEV2(3))) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                      500000 |
+-----------------------------------------------------------------------------------------------------------------------------+
```

## Keywords

    MICROSECONDS_DIFF
