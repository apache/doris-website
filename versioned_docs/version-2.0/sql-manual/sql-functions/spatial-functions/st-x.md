---
{
    "title": "ST_X",
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

When point is a valid POINT type, return the corresponding x-coordinate value

## Syntax

```sql
ST_X( <point>)
```

## Parameters

| Parameters | Instructions |
|------|----------|
| `<point>` | The geometric coordinates of a two-dimensional point |

## Return Value

X value in geometric coordinates

## Examples

```sql
SELECT ST_X(ST_Point(24.7, 56.7));
```

```text
+----------------------------+
| st_x(st_point(24.7, 56.7)) |
+----------------------------+
|                       24.7 |
+----------------------------+
```