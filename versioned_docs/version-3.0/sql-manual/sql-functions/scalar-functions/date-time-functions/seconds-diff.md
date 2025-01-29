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
The `SECONDS_DIFF` function calculates the time difference in seconds between two datetime values. It accepts two datetime arguments and returns the difference as the value of `<end_datetime>` minus `<start_datetime>`.

## Syntax

```sql
SECONDS_DIFF(<end_datetime>, <start_datetime>)
```

## Parameters

| Parameter         | Description                  |
|-------------------|------------------------------|
| `<end_datetime>`  | The ending datetime value.   |
| `<start_datetime>`| The starting datetime value. |

## Return Value
Returns an integer representing the difference in seconds between the two datetime values:
- Returns a positive number if `<end_datetime>` is later than `<start_datetime>`.
- Returns a negative number if `<end_datetime>` is earlier than `<start_datetime>`.
- Returns 0 if `<end_datetime>` and `<start_datetime>` are equal.
- If `<end_datetime>` or `<start_datetime>` is `NULL`, the function returns `NULL`.
- If `<end_datetime>` or `<start_datetime>` is an invalid datetime value (e.g., `0000-00-00 00:00:00`), the function returns `NULL`.

## Example

```sql
select seconds_diff('2020-12-25 22:00:00','2020-12-25 21:00:00');
```
```text
+----------------------------------------------------------------------------------------------------------+
| seconds_diff(cast('2020-12-25 22:00:00' as DATETIMEV2(0)), cast('2020-12-25 21:00:00' as DATETIMEV2(0))) |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                     3600 |
+----------------------------------------------------------------------------------------------------------+
```
