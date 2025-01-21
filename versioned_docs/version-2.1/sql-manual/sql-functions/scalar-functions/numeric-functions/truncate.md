---
{
    "title": "TRUNCATE",
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

Perform numerical truncation on x to the number of decimal places d

## Syntax

```sql
TRUNCATE(<x>, <d>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value that needs to be numerically truncated |
| `<d>` | The number of decimal places to retain |

## Return Value

Perform numerical truncation on x to the number of decimal places d. Truncation rules:

If d is a literal:

- When d > 0: Keep d decimal places of x.
- When d = 0: Remove the decimal part of x and retain only the integer part.
- When d < 0: Remove the decimal part of x and replace the integer part with the number of digits specified by d, using the digit 0.

If d is a column, and the first argument is of type Decimal, then the resulting Decimal will have the same number of decimal places as the input Decimal

## Example

 d is a litera

```sql
select truncate(124.3867, 2),truncate(124.3867, 0),truncate(124.3867, -2);
```

```text
+-----------------------+-----------------------+------------------------+
| truncate(124.3867, 2) | truncate(124.3867, 0) | truncate(124.3867, -2) |
+-----------------------+-----------------------+------------------------+
|                124.38 |                   124 |                    100 |
+-----------------------+-----------------------+------------------------+
```

 d is a column

```sql
select cast("123.123456" as Decimal(9,6)), number, truncate(cast ("123.123456" as Decimal(9,6)), number) from numbers("number"="5");
```

```text
+---------------------------------------+--------+----------------------------------------------------------------------+
| cast('123.123456' as DECIMALV3(9, 6)) | number | truncate(cast('123.123456' as DECIMALV3(9, 6)), cast(number as INT)) |
+---------------------------------------+--------+----------------------------------------------------------------------+
|                            123.123456 |      0 |                                                           123.000000 |
|                            123.123456 |      1 |                                                           123.100000 |
|                            123.123456 |      2 |                                                           123.120000 |
|                            123.123456 |      3 |                                                           123.123000 |
|                            123.123456 |      4 |                                                           123.123400 |
+---------------------------------------+--------+----------------------------------------------------------------------+
```
