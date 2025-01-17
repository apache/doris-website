---
{
    "title": "ST_CONTAINS",
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

Determines whether the geometry shape1 is fully capable of containing the geometry shape2

## Syntax

```sql
ST_Contains( <shape1>, <shape2>)
```

## Parameters

| Parameters | Instructions |
|----------|------------------------|
| `<shape1>` | The passed geometry used to determine whether shape2 is included |
| `<shape2>` | The passed geometry is used to determine whether shape1 is included |

## Return Value

Return 1:shape1 The graph can contain the graph shape2

Return 0:shape1 Graph cannot contain graph shape2


## Examples

```sql
SELECT ST_Contains(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5));
```

```text
+----------------------------------------------------------------------------------------+
| st_contains(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_point(5.0, 5.0)) |
+----------------------------------------------------------------------------------------+
|                                                                                      1 |
+----------------------------------------------------------------------------------------+
```

```sql
SELECT ST_Contains(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50));
```

```text
+------------------------------------------------------------------------------------------+
| st_contains(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_point(50.0, 50.0)) |
+------------------------------------------------------------------------------------------+
|                                                                                        0 |
+------------------------------------------------------------------------------------------+
```
