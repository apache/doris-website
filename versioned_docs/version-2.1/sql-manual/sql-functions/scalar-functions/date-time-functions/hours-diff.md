---
{
    "title": "HOURS_DIFF",
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

Calculates the difference in hours between two datetime values. Returns the number of hours between enddate and startdate.

## Syntax

```sql
INT HOURS_DIFF(DATETIME enddate, DATETIME startdate)
```

## Parameters

| Parameter | Description |
| ---- | ---- |
| enddate | End datetime value, type can be DATETIME or DATE |
| startdate | Start datetime value, type can be DATETIME or DATE |

## Return Value

Returns an INT value representing the number of hours between the two datetime values.

## Examples

```sql
SELECT HOURS_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00');
```

```text
+--------------------------------------------------------------------------------------------------------+
| hours_diff(cast('2020-12-25 22:00:00' as DATETIMEV2(0)), cast('2020-12-25 21:00:00' as DATETIMEV2(0))) |
+--------------------------------------------------------------------------------------------------------+
|                                                                                                      1 |
+--------------------------------------------------------------------------------------------------------+
```

## Keywords

    HOURS_DIFF
