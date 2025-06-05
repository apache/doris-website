---
{
    "title": "YEAR",
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

Returns the year in a date value, ranging from 1000-9999

## Syntax

```sql
YEAR(<date>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<date>` | Corresponding date value, Date or Datetime type |

## Return Value

year in a date value, ranging from 1000-9999

## Example

```sql
SELECT YEAR('1987-01-01'),YEAR('2013-02-11' 10:10:34);
```

```text
+-------------------------------------------+----------------------------------------------------+
| year(cast('1987-01-01' as DATETIMEV2(0))) | year(cast('2013-02-11 10:10:34' as DATETIMEV2(0))) |
+-------------------------------------------+----------------------------------------------------+
|                                      1987 |                                               2013 |
+-------------------------------------------+----------------------------------------------------+
```
