---
{
    "title": "MINUTES_SUB",
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

Subtracts a specified number of minutes from a datetime value and returns a new datetime value.

## Syntax

```sql
MINUTES_SUB(<date>, <minutes>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| date      | The input datetime value, which can be of type DATE, DATETIME, or DATETIMEV2 |
| minutes   | The number of minutes to subtract, of type INT; can be positive or negative |

## Return Value

Returns a value of type DATETIME, representing the datetime value after subtracting the specified number of minutes.

## Example

```sql
SELECT MINUTES_SUB("2020-02-02 02:02:02", 1);
```

```text
+--------------------------------------------------------------+
| minutes_sub(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+--------------------------------------------------------------+
| 2020-02-02 02:01:02                                          |
+--------------------------------------------------------------+
```

**Note:**
- When the number of minutes subtracted is negative, it effectively adds the corresponding number of minutes.
- The function automatically handles cases that cross hours and days.
- If the input parameter is NULL, the function returns NULL.
- The result retains the seconds portion of the original time.
