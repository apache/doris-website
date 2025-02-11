---
{
    "title": "SECOND_CEIL",
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
The function aligns the input datetime value upwards to the nearest second boundary based on the specified period and returns the aligned datetime value.

## Syntax

```sql
SECOND_CEIL(<datetime>[, <period>][, <origin_datetime>])
```
## Parameters

| Parameter           | Description                                                                                                               |
|---------------------|---------------------------------------------------------------------------------------------------------------------------|
| `<datetime>`        | Required. The input datetime value. Supports the DATETIME type.                                                           |
| `<period>`          | Optional. Specifies the number of seconds in each period. Supports positive integers (INT). Defaults to 1 second.         |
| `<origin_datetime>` | Optional. The starting point for alignment. Supports the DATETIME type. Defaults to 0001-01-01T00:00:00 if not specified. |

## Return Value
- Returns a datetime value representing the input datetime aligned upwards to the nearest specified second boundary.
- If `<datetime>` is NULL, the function returns NULL.
- If `<datetime>` is an invalid date (e.g., 0000-00-00T00:00:00), the function returns NULL.

## Example
Only specifying `<datetime>`
```sql
SELECT SECOND_CEIL('2025-01-23 12:34:56');
```
```text
+-----------------------------------------------------------+
| second_ceil(cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+-----------------------------------------------------------+
| 2025-01-23 12:34:56                                       |
+-----------------------------------------------------------+
```
Specifying `<datetime>` and `<origin_datetime>`
```sql
SELECT SECOND_CEIL('2025-01-23 12:34:56', '2025-01-01 00:00:00');
```
```text
+---------------------------------------------------------------------------------------------------------+
| second_ceil(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), cast('2025-01-01 00:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------------------------------------------------------+
| 2025-01-23 12:34:56                                                                                     |
+---------------------------------------------------------------------------------------------------------+
```
Specifying `<datetime>` and `<period>`
```sql
SELECT SECOND_CEIL('2025-01-23 12:34:56', 5)
```
```text
+--------------------------------------------------------------+
| second_ceil(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2025-01-23 12:35:00                                          |
+--------------------------------------------------------------+
```
Specifying `<datetime>`，`<period>` and `<origin_datetime>`
```sql
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00');
```
```text
+-------------------------------------------------------------------------------------------------------------+
| second_ceil(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), 10, cast('2025-01-23 12:00:00' as DATETIMEV2(0))) |
+-------------------------------------------------------------------------------------------------------------+
| 2025-01-23 12:35:00                                                                                         |
+-------------------------------------------------------------------------------------------------------------+
```