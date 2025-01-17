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

Calculates the difference in hours between the start time and the end time.

## Syntax

```sql
HOURS_DIFF(<end_date>, <start_date>)
```

## Parameters

| Parameter  | Description                                     |
|------------|-------------------------------------------------|
| `<end_date>`    | The end time, which can be of type DATETIME or DATE |
| `<start_date>`  | The start time, which can be of type DATETIME or DATE |

## Return Value

Returns an INT type representing the number of hours between the start time and the end time.

## Example

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