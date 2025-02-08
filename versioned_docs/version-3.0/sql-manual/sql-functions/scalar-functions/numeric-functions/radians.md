---
{
    "title": "RADIANS",
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

Returns the value of `x` in radians, converted from degrees to radians.

## Syntax

```sql
RADIANS(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | The angle in degrees to be converted. |

## Return value

Returns an integer or a floating-point number. Special case:

- If the parameter x is NULL, it returns NULL.

## Example

```sql
select radians(0);
```

```text
+----------------------------+
| radians(cast(0 as DOUBLE)) |
+----------------------------+
|                        0.0 |
+----------------------------+
```

```sql
select radians(30);
```

```text
+-----------------------------+
| radians(cast(30 as DOUBLE)) |
+-----------------------------+
|          0.5235987755982988 |
+-----------------------------+
```

```sql
select radians(90);
```

```text
+-----------------------------+
| radians(cast(90 as DOUBLE)) |
+-----------------------------+
|          1.5707963267948966 |
+-----------------------------+
```
