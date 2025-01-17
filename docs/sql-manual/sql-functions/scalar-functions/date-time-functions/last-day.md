---
{
    "title": "LAST_DAY",
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

Returns the date of the last day of the month for the given input date. The returned day varies depending on the month:
- 28th - For February in non-leap years
- 29th - For February in leap years
- 30th - For April, June, September, and November
- 31st - For January, March, May, July, August, October, and December

## Syntax

```sql
LAST_DAY(<date>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| date | Input datetime value, type can be DATETIME or DATE |

## Return Value

Returns a value of type DATE representing the last day of the month for the given input date.

## Example

```sql
SELECT LAST_DAY('2000-02-03');
```

```text
+-----------------------------------------------+
| last_day(cast('2000-02-03' as DATETIMEV2(0))) |
+-----------------------------------------------+
| 2000-02-29                                    |
+-----------------------------------------------+
```
