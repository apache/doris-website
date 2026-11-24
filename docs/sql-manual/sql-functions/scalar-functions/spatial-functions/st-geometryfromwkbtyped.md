---
{
    "title": "ST_GEOMETRYFROMWKBTYPED (Development)",
    "language": "en",
    "description": "Constructs typed GEOMETRY from hexadecimal ISO WKB for Iceberg V3 columns, preserving bytes with default parameters. NULL or invalid input returns NULL."
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

Converts hexadecimal ISO WKB to `GEOMETRY('OGC:CRS84')` in the development version. The resulting value retains the original WKB and can be written to an Iceberg geometry column. NULL input returns NULL.

## Syntax

```sql
ST_GEOMETRYFROMWKBTYPED(<wkb_hex>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<wkb_hex>` | A STRING of hexadecimal ISO WKB. Supports Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, and GeometryCollection, including EMPTY and Z/M coordinates. |

## Return Value

Returns a nullable `GEOMETRY` value. Invalid hexadecimal, invalid WKB, PostGIS EWKB dimension flags or embedded SRIDs, infinite coordinates, and coordinates outside the default geographic range return NULL. EMPTY is a valid spatial value.

## Example

Convert the WKB for a point at (1, 2).

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED('0101000000000000000000F03F0000000000000040'));
```

```text
POINT (1 2)
```

Pass a NULL input.

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED(NULL));
```

```text
NULL
```

Pass EWKB with an embedded SRID.

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED('01010000208A11000068270210774C5D40B8DECA334C3B4240'));
```

```text
NULL
```

For table creation, parameter preservation and computation limits, see [Iceberg spatial types](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types).
