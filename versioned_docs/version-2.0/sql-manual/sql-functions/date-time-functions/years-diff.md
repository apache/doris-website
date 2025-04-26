---
{
    "title": "YEARS_DIFF",
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

Calculates the difference in years between two datetime values.

## Syntax

```sql
YEARS_DIFF(<enddate>, <startdate>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<enddate>`      | The end date, which can be of type DATETIME or DATE |
| `<startdate>`     | The start date, which can be of type DATETIME or DATE |

## Return Value

Returns a value of type INT, representing the number of years between the two dates.

## Example

```sql
SELECT YEARS_DIFF('2020-12-25', '2019-10-25');
```

```text
+----------------------------------------------------------+
| years_diff('2020-12-25 00:00:00', '2019-10-25 00:00:00') |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+
```
