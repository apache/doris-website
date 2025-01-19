---
{
    "title": "LOG10",
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

Returns the natural logarithm of `x` to base `10`.

## Alias

- DLOG10

## Syntax

```sql
LOG10(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | Antilogarithm |

## Return value

Returns a floating-point number.

- x <=0 or x IS NULL: return `NULL`

## Example

```sql
select log10(1);
```

```text
+--------------------------+
| log10(cast(1 as DOUBLE)) |
+--------------------------+
|                      0.0 |
+--------------------------+
```

```sql
select log10(10);
```

```text
+---------------------------+
| log10(cast(10 as DOUBLE)) |
+---------------------------+
|                       1.0 |
+---------------------------+
```

```sql
select log10(16);
```

```text
+---------------------------+
| log10(cast(16 as DOUBLE)) |
+---------------------------+
|        1.2041199826559248 |
+---------------------------+
```