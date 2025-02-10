---
{
    "title": "QUARTERS_SUB",
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
The function adds or subtracts a specified number of quarters to/from a given date or datetime value and returns the resulting date.

## Syntax

```sql
QUARTERS_SUB(<date/datetime>, <quarters>)
```

## Parameters

| Parameter         | Description                                                                                                           |
|-------------------|-----------------------------------------------------------------------------------------------------------------------|
| `<date/datetime>` | The input date or datetime value, supports DATE or DATETIME types.                                                    |
| `<quarters>`      | The number of quarters to add or subtract. Positive integers add quarters, while negative integers subtract quarters. |

## Return Value
- Returns a date value consistent with the input date type.
- If `<date/datetime>` is NULL, the function returns NULL.
- If `<date/datetime>` is an invalid date (e.g., 0000-00-00), the function returns NULL.

### Example

```sql
 select quarters_sub("2020-01-31 02:02:02", 1);
```
```text
+---------------------------------------------------------------+
| quarters_sub(cast('2020-01-31 02:02:02' as DATETIMEV2(0)), 1) |
+---------------------------------------------------------------+
| 2019-10-31 02:02:02                                           |
+---------------------------------------------------------------+
```