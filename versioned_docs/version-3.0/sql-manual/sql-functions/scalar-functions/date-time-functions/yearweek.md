---
{
    "title": "YEARWEEK",
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

Returns the year and week number of the specified date. The default value of mode is 0. When the week of the date belongs to the previous year, the year and week number of the previous year are returned; when the week of the date belongs to the next year, the year of the next year and the week number are 1 are returned.

## Syntax

```sql
YEARWEEK (<date>[, mode])
```

## Parameters

| Parameter | Description |
|---|---|
| `<date>` | Corresponding date value, Date or Datetime type |
| `<mode>` | Optional parameter used to define the weekly calculation rule. The default value is 0 |

## Return Value

The year and week number of the specified date. When the week of the date belongs to the previous year, the year and week number of the previous year are returned; when the week of the date belongs to the next year, the year of the next year and the week number are returned as 1. The default value of mode is 0. The corresponding values are shown in the table below:

|Mode |First day of week |Range  |Definition of the first week     |
|:----|:-----------------|:------|:-----------------------------|
|0    |Sunday            |0-53   |with a Sunday in this year    |
|1    |Monday            |0-53   |with 4 or more days this year |
|2    |Sunday            |1-53   |with a Sunday in this year    |
|3    |Monday            |1-53   |with 4 or more days this year |
|4    |Sunday            |0-53   |with 4 or more days this year |
|5    |Monday            |0-53   |with a Monday in this year    |
|6    |Sunday            |1-53   |with 4 or more days this year |
|7    |Monday            |1-53   |with a Monday in this year    |

## Example

```sql
SELECT YEARWEEK('2020-1-1'),YEARWEEK('2022-7-1',1);
```

```text
+---------------------------------------------+-----------------------------------------+
| yearweek(cast('2020-1-1' as DATETIMEV2(0))) | yearweek(cast('2022-7-1' as DATEV2), 1) |
+---------------------------------------------+-----------------------------------------+
|                                      201952 |                                  202226 |
+---------------------------------------------+-----------------------------------------+
```
