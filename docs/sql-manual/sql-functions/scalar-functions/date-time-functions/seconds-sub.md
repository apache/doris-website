---
{
    "title": "SECONDS_SUB",
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

The function subtracts or adds a specified number of seconds to/from a given datetime value and returns the resulting
datetime.

## Syntax

```sql
SECONDS_SUB(<datetime>, <seconds>)
```

## Parameters

| Parameter    | Description                                                                                                                                         |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime>` | Required. The input datetime value. Supports the DATETIME and DATE type.                                                                            |
| `<seconds>`  | Required. The number of seconds to subtract or add. Supports integers (INT). Positive numbers add seconds, while negative numbers subtract seconds. |

## Return Value
- Returns a datetime value of the same type as the input <datetime>.
- If `<datetime>` is NULL, the function returns NULL.
- If `<datetime>` is an invalid date (e.g., 0000-00-00T00:00:00), the function returns NULL.

## Examples

```
SELECT SECONDS_SUB('2025-01-23 12:34:56', 30),SECONDS_SUB('2025-01-23 12:34:56', -30);
```
```text
+---------------------------------------------------------------+----------------------------------------------------------------+
| seconds_sub(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), 30) | seconds_sub(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), -30) |
+---------------------------------------------------------------+----------------------------------------------------------------+
| 2025-01-23 12:34:26                                           | 2025-01-23 12:35:26                                            |
+---------------------------------------------------------------+----------------------------------------------------------------+
```
