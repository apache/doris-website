---
{
    "title": "MINUTES_DIFF",
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

Calculates the minute difference between two datetime values. The result is the number of minutes from `<start_date>` subtracted from `<end_date>`.

## Syntax

```sql
MINUTES_DIFF(<enddate>, <startdate>)
```

## Parameters

| Parameter  | Description                                     |
|------------|-------------------------------------------------|
| `<end_date>`  | The end time, which can be of type DATE, DATETIME, or DATETIMEV2 |
| `<start_date>`  | The start time, which can be of type DATE, DATETIME, or DATETIMEV2 |

## Return Value

Returns an INT type representing the minute difference between the two times.
- Returns a positive number if `<end_date>` is greater than `<start_date>`.
- Returns a negative number if `<end_date>` is less than `<start_date>`.

## Example

```sql
SELECT MINUTES_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00');
```

```text
+----------------------------------------------------------------------------------------------------------+
| minutes_diff(cast('2020-12-25 22:00:00' as DATETIMEV2(0)), cast('2020-12-25 21:00:00' as DATETIMEV2(0))) |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                       60 |
+----------------------------------------------------------------------------------------------------------+
```

**Note:**
- The calculation only considers complete minutes; seconds and milliseconds are ignored.
- If either input parameter is NULL, the function returns NULL.
- It can handle time differences that span days, months, or years.
