---
{
    "title": "MILLISECONDS_ADD",
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

Adds a specified number of milliseconds to a datetime value and returns a new datetime value.

## Syntax

```sql
MILLISECONDS_ADD(<basetime>, <delta>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<basetime>`  | The input datetime value, of type DATETIMEV2    |
| `<delta>`     | The number of milliseconds to add, of type INT; 1 second = 1,000 milliseconds = 1,000,000 microseconds |

## Return Value

Returns a value of type DATETIMEV2, representing the time value after adding the specified number of milliseconds to the input datetime. The precision of the return value is the same as that of the input parameter basetime.

## Example

```sql
SELECT MILLISECONDS_ADD('2023-09-08 16:02:08.435123', 1);
```

```text
+--------------------------------------------------------------------------+
| milliseconds_add(cast('2023-09-08 16:02:08.435123' as DATETIMEV2(6)), 1) |
+--------------------------------------------------------------------------+
| 2023-09-08 16:02:08.436123                                               |
+--------------------------------------------------------------------------+
```

**Note:**
- In the example, after adding 1 millisecond, the time increases from .435123 to .436123.
- 1 millisecond equals 1000 microseconds.
- The function's result is dependent on the precision of the input time; the example uses a precision of 6 decimal places.
