---
{
    "title": "MONTH",
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

Extracts the month value from a datetime value. The returned value ranges from 1 to 12, representing the 12 months of the year.

## Syntax

```sql
MONTH(<date>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| date      | The input datetime value, which can be of type DATE, DATETIME, or DATETIMEV2 |

## Return Value

Returns an INT type representing the month value:
- Range: 1 to 12
- 1 represents January, and 12 represents December.
- If the input is NULL, the function returns NULL.

## Example

```sql
SELECT MONTH('1987-01-01');
```

```text
+--------------------------------------------+
| month(cast('1987-01-01' as DATETIMEV2(0))) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```
