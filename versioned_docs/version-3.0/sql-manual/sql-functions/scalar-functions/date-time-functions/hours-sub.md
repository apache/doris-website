---
{
    "title": "HOURS_SUB",
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

Returns a new datetime value that is the result of subtracting a specified number of hours from the input datetime.

## Syntax

```sql
HOURS_SUB(<date>, <hours>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`      | The input datetime value, which can be of type DATETIME or DATE |
| `<hours>`     | The number of hours to subtract, of type INT     |

## Return Value

Returns a value of type DATETIME, representing the time value after subtracting the specified number of hours from the input datetime.

## Example

```sql
SELECT HOURS_SUB('2020-02-02 02:02:02', 1);
```

```text
+------------------------------------------------------------+
| hours_sub(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 01:02:02                                        |
+------------------------------------------------------------+
```
