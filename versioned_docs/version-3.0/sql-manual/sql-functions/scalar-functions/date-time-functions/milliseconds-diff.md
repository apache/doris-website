---
{
    "title": "MILLISECONDS_DIFF",
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

Calculates the millisecond difference between two datetime values. The result is the number of milliseconds from `<start_date>` subtracted from `<end_date>`.

## Syntax

```sql
MILLISECONDS_DIFF(<enddate>, <startdate>)
```

## Parameters

| Parameter  | Description                                     |
|------------|-------------------------------------------------|
| `<end_date>`    | The end time, of type DATETIMEV2               |
| `<start_date>`  | The start time, of type DATETIMEV2             |

## Return Value

Returns an INT type representing the millisecond difference between the two times.
- Returns a positive number if `<end_date>` is greater than `<start_date>`.
- Returns a negative number if `<end_date>` is less than `<start_date>`.
- 1 second = 1,000 milliseconds.
- 1 millisecond = 1,000 microseconds.

## Example

```sql
SELECT MILLISECONDS_DIFF('2020-12-25 21:00:00.623000', '2020-12-25 21:00:00.123000');
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| milliseconds_diff(cast('2020-12-25 21:00:00.623000' as DATETIMEV2(3)), cast('2020-12-25 21:00:00.123000' as DATETIMEV2(3))) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                         500 |
+-----------------------------------------------------------------------------------------------------------------------------+
```

**Note:**
- The time difference in the example is 0.5 seconds, which equals 500 milliseconds.
- The function's result is dependent on the precision of the input time; the example uses a precision of 3 decimal places.
- The result only returns the millisecond difference and does not include the microsecond part.
