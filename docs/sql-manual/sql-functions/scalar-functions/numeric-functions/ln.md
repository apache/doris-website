---
{
    "title": "LN",
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

Returns the natural logarithm of `x` to base `e`.

## Alias

- DLOG1

## Syntax

```sql
LN(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | Antilogarithm should be greater than 0 |

## Return value

Return a float-point number. Special cases:

- If x IS NULL, return NULL

## Example

```sql
select ln(1);
```

```text
+-----------------------+
| ln(cast(1 as DOUBLE)) |
+-----------------------+
|                   0.0 |
+-----------------------+
```

```sql
select ln(e());
```

```text
+---------+
| ln(e()) |
+---------+
|     1.0 |
+---------+
```

```sql
select ln(10);
```

```text
+------------------------+
| ln(cast(10 as DOUBLE)) |
+------------------------+
|      2.302585092994046 |
+------------------------+
```