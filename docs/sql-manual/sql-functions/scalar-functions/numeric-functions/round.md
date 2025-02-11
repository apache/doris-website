---
{
    "title": "ROUND",
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

Rounds the number `x` to the specified number of digits.
- If `d` is not specified, `x` is rounded to the nearest integer.
- If `d` is negative, the result is rounded to the left of the decimal point by `d` places.
- If `x` or `d` is `null`, returns `null`.
- If `d` is a column and the first argument is of type `Decimal`, the resulting `Decimal` will have the same number of decimal places as the input `Decimal`.


## Alias

- `DROUND`

## Syntax

```sql
ROUND(<x> [ , <d> ])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The number to be rounded |
| `<d>` | Optional, the number of decimal places to round to |

## Examples

```sql
select round(2.4);
```

```text
+------------+
| round(2.4) |
+------------+
|          2 |
+------------+
```

```sql
select round(2.5);
```

```text
+------------+
| round(2.5) |
+------------+
|          3 |
+------------+
```

```sql
select round(-3.4);
```

```text
+-------------+
| round(-3.4) |
+-------------+
|          -3 |
+-------------+
```

```sql
select round(-3.5);
```

```text
+-------------+
| round(-3.5) |
+-------------+
|          -4 |
+-------------+
```

```sql
select round(1667.2725, 2);
```

```text
+---------------------+
| round(1667.2725, 2) |
+---------------------+
|             1667.27 |
+---------------------+
```

```sql
select round(1667.2725, -2);
```

```text
+----------------------+
| round(1667.2725, -2) |
+----------------------+
|                 1700 |
+----------------------+
```

```sql
CREATE TABLE test_enhanced_round (
    rid int, flo float, dou double,
    dec90 decimal(9, 0), dec91 decimal(9, 1), dec99 decimal(9, 9),
    dec100 decimal(10,0), dec109 decimal(10,9), dec1010 decimal(10,10),
    number int DEFAULT 1)
DISTRIBUTED BY HASH(rid)
PROPERTIES("replication_num" = "1" );

INSERT INTO test_enhanced_round
VALUES
(1, 12345.123, 123456789.123456789,
    123456789, 12345678.1, 0.123456789,
    123456789.1, 1.123456789, 0.123456789, 1);

SELECT number, dec90, round(dec90, number), dec91, round(dec91, number), dec99, round(dec99, number) FROM test_enhanced_round order by rid;
```

```text
+--------+-----------+----------------------+------------+----------------------+-------------+----------------------+
| number | dec90     | round(dec90, number) | dec91      | round(dec91, number) | dec99       | round(dec99, number) |
+--------+-----------+----------------------+------------+----------------------+-------------+----------------------+
|      1 | 123456789 |            123456789 | 12345678.1 |           12345678.1 | 0.123456789 |          0.100000000 |
+--------+-----------+----------------------+------------+----------------------+-------------+----------------------+
```

## Usage Note
2.5 will round to 3. If you want to round to 2, use the `round_bankers` function.
