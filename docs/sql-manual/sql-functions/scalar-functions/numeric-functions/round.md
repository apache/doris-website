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

Round x to d decimal places. The default value of d is 0.

If d is negative, the |d| digits to the left of the decimal point will be set to 0.

If either x or d is null, return null.

If d is a column and the first argument is of the Decimal type, then the resulting Decimal will have the same number of decimal places as the input Decimal.

## Alias

- DROUND

## Syntax

```sql
ROUND(x [ , d])
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`  | The number to be rounded. |
| `<d>`  | Precision, with a default value of 0. |

## Return value

Returns an integer or a floating-point number:

- By default, when the parameter d = 0, it returns the integer obtained by rounding x.

- If d is a negative number, it returns an integer with the first digit to the left of the decimal point being 0.

- If both x and d are NULL, it returns NULL.

- If d represents a column and x is of the Decimal type, it returns a floating-point number with the same precision.

## Example

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
SELECT number
, round(number * 2.5, number - 1) AS r_decimal_column
, round(number * 2.5, 0) AS r_decimal_literal
, round(cast(number * 2.5 AS DOUBLE), number - 1) AS r_double_column
, round(cast(number * 2.5 AS DOUBLE), 0) AS r_double_literal
FROM test_enhanced_round
WHERE rid = 1;
```

```text
+--------+------------------+-------------------+-----------------+------------------+
| number | r_decimal_column | r_decimal_literal | r_double_column | r_double_literal |
+--------+------------------+-------------------+-----------------+------------------+
|      1 |              3.0 |                 3 |               3 |                3 |
+--------+------------------+-------------------+-----------------+------------------+
```