---
{
    "title": "DAY_FLOOR",
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

Rounds the date down to the nearest timestamp of the specified time interval period.

## Syntax

```sql
DAY_FLOOR(<datetime>)
DAY_FLOOR(<datetime>, <origin>)
DAY_FLOOR(<datetime>, <period>)
DAY_FLOOR(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<datetime>` | A valid date expression |
| `<period>` | Specifies how many days make up each period |
| `<origin>` | The starting point of time. If not provided, the default is 0001-01-01T00:00:00 |

## Return Value

Returns the date of the nearest rounded-up timestamp.

## Examples

```sql
select day_floor("2023-07-13 22:28:18", 5);
```

```text
+------------------------------------------------------------+
| day_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2023-07-12 00:00:00                                        |
+------------------------------------------------------------+
```
