---
{
    "title": "DAYS_SUB",
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

Subtracts a specified time interval to the date.

## Alias

## 别名

- days_sub
- date_sub
- subdate

## Syntax

```sql
DATE_SUB(<date>, <expr> <time_unit>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date>` | A valid date value |
| `<expr>`| The time interval you want to subtract |
| `<type>` | Enumerated values: YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND |

## Return Value

Returns the calculated date.

## Examples

```sql
select date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY);
```

```text
+-------------------------------------------------+
| date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-11-28 23:59:59                             |
+-------------------------------------------------+
```
