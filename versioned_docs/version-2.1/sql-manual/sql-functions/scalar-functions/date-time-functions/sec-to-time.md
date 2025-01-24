---
{
    "title": "SEC_TO_TIME",
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
The `SEC_TO_TIME` function converts a value in seconds into a `TIME` type, returning the result in the format `HH:MM:SS`.  
The input seconds represent the time elapsed since the start of a day (`00:00:00`).


## Syntax

```sql
SEC_TO_TIME(<seconds>)
```
## Parameters

| Parameter     | Description                                                                                                                                           |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<seconds>` | Required. The input number of seconds, representing the time elapsed since the start of a day (00:00:00). Supports positive or negative integers. |

## Return Value
- Returns a TIME value in the format `HH:MM:SS`, representing the time calculated from the start of a day (00:00:00).
- If <seconds> is NULL, the function returns NULL.

## Example
```sql
SELECT SEC_TO_TIME(59738);
```
```text
+--------------------+
| sec_to_time(59738) |
+--------------------+
| 16:35:38           |
+--------------------+
```