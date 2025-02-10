---
{
    "title": "MOD",
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

Find the remainder of a divided by b for the integer type. For the floating-point type, please use the fmod function.

## Syntax

```sql
MOD(<col_a> , <col_b>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<col_a>`   | Dividend |
| `<col_b>`   | Divisor should not be 0 |

## Return value

Return an integer type. Special cases:

If col_a IS NULL or col_b IS NULL, return NULL.

## Example

```sql
select mod(10, 3);
```

```text
+----------+
| (10 % 3) |
+----------+
|        1 |
+----------+
```

```sql
select mod(10, 0);
```

```text
+----------+
| (10 % 0) |
+----------+
|     NULL |
+----------+
```