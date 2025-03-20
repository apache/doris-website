---
{
    "title": "WEEKDAY",
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

Returns the weekday index of a date, i.e. Monday is 0, Tuesday is 1, and Sunday is 6

## Syntax

```sql
WEEKDAY (<date>)
```

## Parameters

| Parameter | Description |
|---|--|
| `<date>` | Corresponding date value, of Date or Datetime type or a number that can be cast to Date or Datetime type |

## Return Value

The weekday index of the date, i.e. Monday is 0, Tuesday is 1, and Sunday is 6

## Example

```sql
SELECT WEEKDAY('2019-06-25'),WEEKDAY(cast(20190625 as date));
```

```text
+----------------------------------------------+-----------------------------------+
| weekday(cast('2019-06-25' as DATETIMEV2(0))) | weekday(cast(20190625 as DATEV2)) |
+----------------------------------------------+-----------------------------------+
|                                            1 |                                 1 |
+----------------------------------------------+-----------------------------------+
```

## Precautions

Note the difference between WEEKDAY and DAYOFWEEK:

```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```
