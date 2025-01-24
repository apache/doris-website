---
{
    "title": "PMOD",
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

Returns the smallest positive solution of the modulo operation x mod y within the modular system. Specifically, the result is obtained by calculating (x % y + y) % y.

## Syntax

```sql
PMOD(<x> , <y>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>` | Dividend |
| `<y>` | Divisor  should not be 0 |

## Return value

Returns an integer or a floating-point number. Special cases:

- If x = 0, returns 0.
- If x is NULL or y is NULL, returns NULL.

## Example

```sql
SELECT PMOD(13,5);
```

```text
+-------------+
| pmod(13, 5) |
+-------------+
|           3 |
+-------------+
```

```sql
SELECT PMOD(-13,5);
```

```text
+--------------+
| pmod(-13, 5) |
+--------------+
|            2 |
+--------------+
```

```sql
SELECT PMOD(0,-12);
```

```text
+--------------+
| pmod(0, -12) |
+--------------+
|            0 |
+--------------+
```

```sql
SELECT PMOD(0,null);
```

```text
+-------------------------------+
| pmod(cast(0 as DOUBLE), NULL) |
+-------------------------------+
|                          NULL |
+-------------------------------+
```