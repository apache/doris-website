---
{
    "title": "ST_GEOMETRYFROMTEXT",
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

Convert a WKT (Well Known Text) to the corresponding memory geometry


## Alias

- ST_GEOMFROMTEXT

## Syntax

```sql
ST_GEOMETRYFROMTEXT( <wkt>)
```
## Parameters

| Parameters | Instructions |
|------------|---------|
| `<wkt>`    | The memory form of the graph |

## Support WKT Formats

- `POINT` - A single point in space
- `LINESTRING` - A sequence of connected line segments
- `POLYGON` - A closed area defined by one or more rings, requiring at least three distinct points and closed ends.
- `MULTIPOLYGON` - A collection of polygons, requiring polygons in a multipolygon can only share discrete points.

:::info Note
Supported MULTIPOLYGON format parsing since Apache Doris 2.1.10
:::

## Return Value

The corresponding geometric storage form of WKB

Returns NULL when the input WKT format does not conform to specifications or when the input is NULL.

## Examples

```sql
-- POINT example
SELECT ST_AsText(ST_GeometryFromText("POINT (1 1)"));
```

```text
+-----------------------------------------------+
| ST_AsText(ST_GeometryFromText("POINT (1 1)")) |
+-----------------------------------------------+
| POINT (1 1)                                   |
+-----------------------------------------------+
```

```sql
-- POINT illegal example(too many points)
SELECT ST_AsText(ST_GeometryFromText("POINT (1 1, 2 2)"));
```

```text
+----------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POINT (1 1, 2 2)")) |
+----------------------------------------------------+
| NULL                                               |
+----------------------------------------------------+
```

```sql
-- LINESTRING example
SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```

```sql
-- LINESTRING illegal example(too few verteices)
SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1)"));
```

```text
+----------------------------------------------------+
| ST_AsText(ST_GeometryFromText("LINESTRING (1 1)")) |
+----------------------------------------------------+
| NULL                                               |
+----------------------------------------------------+
```

```sql
-- POLYGON example
SELECT ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))"));
```

``` text
+-----------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))")) |
+-----------------------------------------------------------------------+
| POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))                                   |
+-----------------------------------------------------------------------+
```

```sql
-- POLYGON illegal example(not closed end to end)
SELECT ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 1 1, 0 1))"));
```

```text
+------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 1 1, 0 1))")) |
+------------------------------------------------------------------+
| NULL                                                             |
+------------------------------------------------------------------+
```

```sql
-- POLYGON illegal example(too few verteices)
SELECT ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 0 0))"));
```

```text
+-------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 0 0))")) |
+-------------------------------------------------------------+
| NULL                                                        |
+-------------------------------------------------------------+
```

```sql
-- MULTIPOLYGON example
SELECT ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))"));
```

```text
+-----------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))")) |
+-----------------------------------------------------------------------------------------------------------+
| MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))                                   |
+-----------------------------------------------------------------------------------------------------------+
```

```sql
-- MULTIPOLYGON example (polygons in multipolygon only share discrete points.)
SELECT ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0), (4 4, 6 4, 6 6, 4 6, 4 4)), ((4 5, 5 4, 6 5, 5 6, 4 5)))"));
```

```text
+------------------------------------------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0), (4 4, 6 4, 6 6, 4 6, 4 4)), ((4 5, 5 4, 6 5, 5 6, 4 5)))")) |
+------------------------------------------------------------------------------------------------------------------------------------------+
| MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0), (4 4, 6 4, 6 6, 4 6, 4 4)), ((4 5, 5 4, 6 5, 5 6, 4 5)))                                   |
+------------------------------------------------------------------------------------------------------------------------------------------+
```

``` sql
-- MULTIPOLYGON illegal example(overlap exists)
SELECT ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0)), ((10 0, 20 0, 20 10, 10 10, 10 0)))"));
```

```text
+----------------------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0)), ((10 0, 20 0, 20 10, 10 10, 10 0)))")) |
+----------------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                                 |
+----------------------------------------------------------------------------------------------------------------------+
```

```sql
-- input NULL
SELECT ST_AsText(ST_GeometryFromText(NULL));
```

```text
+--------------------------------------+
| ST_AsText(ST_GeometryFromText(NULL)) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```