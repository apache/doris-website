---
{
    "title": "DAYOFWEEK",
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

Returns the weekday index of the date, where Sunday is 1, Monday is 2, and Saturday is 7.

## Syntax

```sql
INT DAYOFWEEK(DATE date)
INT DAYOFWEEK(DATETIME date)
```

## Parameters

| Parameter | Description |
| -- | -- |
| dt | The date expression to be calculated |

## Return Value

Returns the weekday index of the date.

## Examples

```sql
select dayofweek('2019-06-25');
```

```text
+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+
```text

```sql
select dayofweek(cast(20190625 as date)); 
```

```text
+-----------------------------------+
| dayofweek(CAST(20190625 AS DATE)) |
+-----------------------------------+
|                                 3 |
+-----------------------------------+
```