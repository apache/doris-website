---
{
    "title": "SECONDS_DIFF",
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
The function calculates the time difference between two datetime values and returns the difference in seconds.

## Syntax

```sql
SECONDS_DIFF(<end_datetime>, <start_datetime>)
```
## Parameters

| Parameter          | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `<end_datetime>`   | Required. The ending datetime value. Supports the DATETIME and DATE type.   |
| `<start_datetime>` | Required. The starting datetime value. Supports the DATETIME and DATE type. |

## Return Value
- Returns an integer representing the difference in seconds between two datetime values:
  - If `<end_datetime>` is later than `<start_datetime>`, returns a positive value.
  - If `<end_datetime>` is earlier than `<start_datetime>`, returns a negative value.
  - If `<end_datetime>` and `<start_datetime>` are equal, returns 0.
- If either parameter is NULL, the function returns NULL.
- If the input datetime values are invalid (e.g., 0000-00-00T00:00:00), the function returns NULL.

## Example
```sql
SELECT SECONDS_DIFF('2025-01-23 12:35:56', '2025-01-23 12:34:56');
```
```text
+----------------------------------------------------------------------------------------------------------+
| seconds_diff(cast('2025-01-23 12:35:56' as DATETIMEV2(0)), cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                       60 |
+----------------------------------------------------------------------------------------------------------+
```
