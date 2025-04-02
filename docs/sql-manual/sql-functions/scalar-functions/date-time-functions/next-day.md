---
{
    "title": "NEXT_DAY",
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
The NEXT_DAY function is used to return the first date that is later than the given date and matches the specified day of the week.

## Syntax

```sql
NEXT_DAY(<datetime/date>, <day_of_week>)
```

## Parameters

| Parameter         | Description                                                |
|-------------------|------------------------------------------------------------|
| `<datetime/date>` | The date value with the day of week to be found.           |
| `<day_of_week>`   | A STRING expression identifying a day of the week.         |

## Return Value
A <date> whatever the input is <datetime> or <date>.


<day_of_week> must be one of the following (case insensitive):
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

Special cases:
- If the <datetime/date> input is NULL, the function returns NULL.
- If the input is NEXT_DAY("9999-12-31", <day_of_week>), the function will return same value as the input.

## Example

``` sql
select next_day("2020-01-31 02:02:02", "MONDAY"),next_day("2020-01-31", "MONDAY");
```
```text
+--------------------------------------------+-----------------------------------+
| next_day("2020-01-31 02:02:02", "MONDAY")  | next_day("2020-01-31", "MONDAY")  |
+--------------------------------------------+-----------------------------------+
| 2020-02-03                                 | 2020-02-03                        |
+--------------------------------------------+-----------------------------------+
```