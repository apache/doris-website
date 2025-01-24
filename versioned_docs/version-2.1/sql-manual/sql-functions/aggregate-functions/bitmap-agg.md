---
{
"title": "BITMAP_AGG",
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

Aggregate the values of a column (excluding any NULL values) and return a single row bitmap value, i.e., convert multiple rows into one.

## Syntax

```sql
BITMAP_AGG(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression of values to be aggregated. The type of expr must be TINYINT, SMALLINT, INT, LARGEINT, or BIGINT, and it also supports VARCHAR that can be converted to one of these types. |

## Return Value

Returns a BITMAP type value. Special cases:

- If a value is less than 0 or greater than 18446744073709551615, the value will be ignored and will not be merged into the Bitmap.

## Example

```sql
select * from test_bitmap_agg;
```

```text
+------+------+------+------+------+-------------+----------------------+
| id   | k0   | k1   | k2   | k3   | k4          | k5                   |
+------+------+------+------+------+-------------+----------------------+
|    1 |   10 | 110  |   11 |  300 | 10000000000 | 0                    |
|    2 |   20 | 120  |   21 |  400 | 20000000000 | 200000000000000      |
|    3 |   30 | 130  |   31 |  350 | 30000000000 | 300000000000000      |
|    4 |   40 | 140  |   41 |  500 | 40000000000 | 18446744073709551616 |
|    5 |   50 | 150  |   51 |  250 | 50000000000 | 18446744073709551615 |
|    6 |   60 | 160  |   61 |  600 | 60000000000 | -1                   |
|    7 |   60 | 160  |  120 |  600 | 60000000000 | NULL                 |
+------+------+------+------+------+-------------+----------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k0)) from test_bitmap_agg;
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_agg(k0)) |
+----------------------------------+
| 10,20,30,40,50,60                |
+----------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg;
```

```text
+--------------------------------------------------------+
| bitmap_to_string(bitmap_agg(cast(k5 as BIGINT)))       |
+--------------------------------------------------------+
| 0,200000000000000,300000000000000,18446744073709551615 |
+--------------------------------------------------------+
```

