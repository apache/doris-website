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

Convert a linear WKT (Well Known Text) to the corresponding memory geometry


## Alias

- ST_GEOMFROMTEXT

## Syntax

```sql
ST_GEOMETRYFROMTEXT( <wkt>)
```
## Parameters

| Parameters | Instructions |
| -- |---------|
| `<wkt>` | The memory form of the graph |

## Support WKT Formats

- `POINT` - A single point in space
- `LINESTRING` - A sequence of connected line segments
- `POLYGON` - A closed area defined by one or more rings
- `MULTIPOLYGON` - A collection of polygons

:::info Note
Supported MULTIPOLYGON format parsing since Apache Doris 3.0.6
:::

## Return Value

The corresponding geometric storage form of WKB

## Examples

```sql
SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```