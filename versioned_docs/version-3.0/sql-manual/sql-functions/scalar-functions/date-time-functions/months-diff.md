---
{
    "title": "MONTHS_DIFF",
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
The `MONTHS_DIFF` function calculates the number of complete months between two dates. It accepts two date arguments and returns the difference in months as an integer.

## Syntax

```sql
MONTHS_DIFF(<enddate>, <startdate>)
```

## Parameters

| 参数            | 说明                                                                                                                                                                      |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<enddate>`   | The ending date, representing the later date in the difference calculation. Supports `DATE` (e.g., `YYYY-MM-DD`) or `DATETIME` (e.g., `YYYY-MM-DD HH:MM:SS`) types.     |
| `<startdate>` | The starting date, representing the earlier date in the difference calculation. Supports `DATE` (e.g., `YYYY-MM-DD`) or `DATETIME` (e.g., `YYYY-MM-DD HH:MM:SS`) types. |

## Return Value

returns the number of months resulting from `<enddate>` minus `<startdate>`
- When either `<enddate>` or `<startdate>` is NULL, or both are NULL, it returns NULL


## Example

```sql
select months_diff('2020-12-25','2020-10-25'),months_diff('2020-10-25 10:00:00','2020-12-25 11:00:00');
```

```text
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
| months_diff(cast('2020-12-25' as DATETIMEV2(0)), cast('2020-10-25' as DATETIMEV2(0))) | months_diff(cast('2020-10-25 10:00:00' as DATETIMEV2(0)), cast('2020-12-25 11:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
|                                                                                     2 |                                                                                                      -2 |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
```
