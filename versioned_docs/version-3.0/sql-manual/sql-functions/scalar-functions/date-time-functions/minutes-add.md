---
{
    "title": "MINUTES_ADD",
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

Adds a specified number of minutes to a datetime value and returns a new datetime value.

## Syntax

```sql
DATETIME MINUTES_ADD(DATETIME date, INT minutes)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| date      | The input datetime value, which can be of type DATE, DATETIME, or DATETIMEV2 |
| minutes   | The number of minutes to add, of type INT; can be positive or negative |

## Return Value

Returns a value of type DATETIME, representing the datetime value after adding the specified number of minutes.

## Example

```sql
SELECT MINUTES_ADD("2020-02-02", 1);
```

```text
+-----------------------------------------------------+
| minutes_add(cast('2020-02-02' as DATETIMEV2(0)), 1) |
+-----------------------------------------------------+
| 2020-02-02 00:01:00                                 |
+-----------------------------------------------------+
```

**Note:**
- When the number of minutes added is negative, it effectively subtracts the corresponding number of minutes.
- The function automatically handles cases that cross hours and days.
- If the input parameter is NULL, the function returns NULL.

## Keywords

    MINUTES_ADD
