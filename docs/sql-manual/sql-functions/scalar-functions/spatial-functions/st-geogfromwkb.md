---
{
    "title": "ST_GEOGFROMWKB (Development)",
    "language": "en",
    "description": "Constructs typed GEOGRAPHY from hexadecimal ISO WKB for Iceberg V3 columns, preserving bytes with default parameters. NULL or invalid input returns NULL."
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

Constructs a typed GEOGRAPHY value from hexadecimal ISO WKB (XY, XYZ, XYM and XYZM). The value preserves the original bytes and uses OGC:CRS84, spherical. NULL input returns NULL.

This function belongs to the development version with Iceberg V3 spatial support. Use the typed result for Iceberg spatial columns. Historical `ST_GEOMETRYFROMWKB` and `ST_GEOMFROMWKB` continue to return legacy STRING geometry values.

## Syntax

```sql
ST_GEOGFROMWKB(<wkb_hex>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<wkb_hex>` | STRING containing hexadecimal standard ISO WKB (XY, XYZ, XYM and XYZM). Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon and GeometryCollection are supported, including EMPTY values. Z/M ordinates are retained. PostGIS EWKB dimension flags and embedded SRID metadata are unsupported. |

## Return Value

Returns a nullable value of type `GEOGRAPHY` with default parameters `OGC:CRS84, spherical`. Invalid hexadecimal/WKB, unsupported EWKB flags/embedded SRID, infinite coordinates or coordinates outside the geographic range return NULL. EMPTY is a geometry value distinct from SQL NULL.

## Example

```sql
SELECT ST_AsText(ST_GEOGFROMWKB('0101000000000000000000F03F0000000000000040'));
```

```text
POINT (1 2)
```

```sql
SELECT ST_AsText(ST_GEOGFROMWKB(NULL));
```

```text
NULL
```

```sql
SELECT ST_AsText(ST_GEOGFROMWKB('01010000208A11000068270210774C5D40B8DECA334C3B4240'));
```

```text
NULL
```

For table creation, parameter preservation and computation limits, see [Iceberg spatial types](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types).
