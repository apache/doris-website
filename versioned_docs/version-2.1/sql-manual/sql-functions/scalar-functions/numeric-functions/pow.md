---
{
    "title": "POW",
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

Returns the value of the first argument raised to the power of the second argument.

## Alias

- POWER
- FPOW
- DPOW

## Syntax

```sql
POW(<a> , <b>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<a>`   | Base   |
| `<b>`   | Power  |

## Return value

Return an integer type or a floating-point type. Special cases:

- If a IS NULL or b IS NULL, return NULL.
- If b = 0 and a IS NOT NULL, it will always return 1.

## Example

```sql
select pow(2,0);
```

```text
+-------------------------------------------+
| pow(cast(2 as DOUBLE), cast(0 as DOUBLE)) |
+-------------------------------------------+
|                                         1 |
+-------------------------------------------+
```

```sql
select pow(2,3);
```

```text
+-------------------------------------------+
| pow(cast(2 as DOUBLE), cast(3 as DOUBLE)) |
+-------------------------------------------+
|                                         8 |
+-------------------------------------------+
```

```sql
select pow(3,2.4);
```

```text
+---------------------------------------------+
| pow(cast(3 as DOUBLE), cast(2.4 as DOUBLE)) |
+---------------------------------------------+
|                          13.966610165238235 |
+---------------------------------------------+
```