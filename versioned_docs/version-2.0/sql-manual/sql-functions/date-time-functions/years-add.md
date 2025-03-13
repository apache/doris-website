---
{
    "title": "YEARS_ADD",
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

Returns a new datetime value that is the result of adding a specified number of years to the input datetime.

## Syntax

```sql
YEARS_ADD(<date>, <years>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`      | The input datetime value, which can be of type DATETIME or DATE |
| `<years>`     | The number of years to add, of type INT         |

## Return Value

Returns a value with the same type as the input `<date>` (DATETIME or DATE), representing the time value after adding the specified number of years to the input datetime.

## Example

```sql
SELECT YEARS_ADD('2020-01-31 02:02:02', 1);
```

```text
+-------------------------------------+
| years_add('2020-01-31 02:02:02', 1) |
+-------------------------------------+
| 2021-01-31 02:02:02                 |
+-------------------------------------+
```
