---
{
    "title": "FMOD",
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

Find the remainder of a / b for the floating-point type. For the integer type, please use the mod function.

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

Return a float-point type. Special cases:

If col_a IS NULL or col_b IS NULL, return NULL.

## Example

```sql
select fmod(10.1, 3.2);
```

```text
+-----------------+
| fmod(10.1, 3.2) |
+-----------------+
|      0.50000024 |
+-----------------+
```

```sql
select fmod(10.1, 0);
```

```text
+---------------+
| fmod(10.1, 0) |
+---------------+
|          NULL |
+---------------+
```