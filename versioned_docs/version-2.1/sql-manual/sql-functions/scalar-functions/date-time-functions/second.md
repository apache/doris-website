---
{
    "title": "SECOND",
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
The function returns the second part of the specified datetime value. The range of seconds is 0 to 59.

## Syntax

```sql
SECOND(<datetime>)
```
## Parameters

| Parameter    | Description                                                        |
|--------------|--------------------------------------------------------------------|
| `<datetime>` | The input date or datetime value. Supports DATE or DATETIME types. |

## Return Value
- Returns an integer representing the second part of the input datetime value, ranging from 0 to 59.
- If the input is NULL, the function returns NULL.
- If the input is an invalid date (e.g., 0000-00-00 00:00:00), the function returns NULL.

## Example
```sql
select second('2018-12-31 23:59:59');
```
```text
+---------------------------------------------+
| second(cast('2018-12-30' as DATETIMEV2(0))) |
+---------------------------------------------+
|                                           0 |
+---------------------------------------------+
```