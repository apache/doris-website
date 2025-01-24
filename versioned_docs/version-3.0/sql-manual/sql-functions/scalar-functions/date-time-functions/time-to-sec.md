---
{
    "title": "TIME_TO_SEC",
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
The function converts an input `TIME` or `DATETIME` value into the total time in seconds. If the input is of `DATETIME` type, the function automatically extracts the time part (`HH:MM:SS`).


## Syntax

```sql
TIME_TO_SEC(<time>)
```
## Parameters

| Parameter | Description                                                                                                                |
|-----------|----------------------------------------------------------------------------------------------------------------------------|
| `<time>`  | Required. Supports TIME or DATETIME values. If the input is DATETIME, the function extracts the time part for calculation. |

## Return Value
- Returns an integer representing the total seconds of the input time value.
- If <time> is NULL, the function returns NULL.

## Example

```sql
SELECT TIME_TO_SEC('16:32:18'),TIME_TO_SEC('2025-01-01 16:32:18');
```
```text
+---------------------------------------+--------------------------------------------------+
| time_to_sec(cast('16:32:18' as TIME)) | time_to_sec(cast('2025-01-01 16:32:18' as TIME)) |
+---------------------------------------+--------------------------------------------------+
|                                 59538 |                                            59538 |
+---------------------------------------+--------------------------------------------------+
```