---
{
    "title": "DATE_ADD",
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

Add a specified time interval to the date.

## Alias

- date_add
- days_add
- adddate

## Syntax

```sql
DATE_ADD(<date>, <expr> <time_unit>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date>` | A valid date value, of type `DATETIME` or `DATE` |
| `<expr>` | The time interval you want to add |
| `<time_unit>` | Enumerated values: YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND |

## Return Value

Returns the calculated new date.

The return value type is consistent with the input <date> type.

Special cases:

- When <date> input is NULL, returns NULL
- If the calculation result is out of range, SQL execution will report an error. In `where` conditions, to avoid errors, you can rewrite it as [`TIMESTAMPDIFF`](./timestampdiff)

## Examples

```sql
select date_add('2010-11-30 23:59:59', INTERVAL 2 DAY);
```

```text
+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+
```

```sql
select date_add('0000-01-01 23:59:59', INTERVAL -2 DAY);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [E-218] Operation days_add of 0000-01-01 23:59:59, -2 out of range
```