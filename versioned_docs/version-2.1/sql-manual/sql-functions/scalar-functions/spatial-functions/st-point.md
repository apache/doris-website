---
{
    "title": "ST_POINT",
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

## ST_Point
## Description

With the given X coordinate value, the Y coordinate value returns the corresponding Point.

The current value is only meaningful in the sphere set, X/Y corresponds to longitude/latitude;

## Syntax

```sql
POINT ST_Point(DOUBLE x, DOUBLE y)
```
## Parameters

| Parameters | Instructions |
|-----|--------------|
| `x` | x-coordinate |
| `y` | y-coordinate |

## Return Value

Given horizontal coordinate and vertical coordinate corresponding position information

## Examples

```sql
SELECT ST_AsText(ST_Point(24.7, 56.7));
```

```text
+---------------------------------+
| st_astext(st_point(24.7, 56.7)) |
+---------------------------------+
| POINT (24.7 56.7)               |
+---------------------------------+
```