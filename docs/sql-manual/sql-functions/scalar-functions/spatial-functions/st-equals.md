---
{
    "title": "ST_EQUALS",
    "language": "en",
    "description": "Tests whether two spatial values have the same dimension and occupy the same point set."
}
---

## Description

Tests whether two spatial values have the same dimension and occupy the same point set. WKB byte order, line direction, subdivision along the same geodesic, and polygon ring start or direction do not change equality. Different dimensions return false. This function neither changes raw WKB nor enables spatial SQL `=`, grouping or deduplication.

The development-version typed interface accepts nonempty XY Point, LineString and Polygon values with default `GEOGRAPHY(OGC:CRS84, spherical)` semantics. Geometry, other CRS/algorithms, Z/M, Multi*/GeometryCollection and EMPTY are not supported for calculations; valid raw values remain available for storage and access. NULL arguments return NULL. Edges are spherical geodesics, with the existing smaller-region polygon-ring interpretation. No spatial index or predicate pushdown is provided.

## Syntax

```sql
ST_EQUALS(<a>, <b>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `a`, `b` | GEOGRAPHY values with their complete type parameters. |

## Return Value

Nullable BOOLEAN.

## Example

```sql
SELECT ST_Equals(g, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
true
```

NULL input:

```sql
SELECT ST_Equals(NULL, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
NULL
```

See also: [Iceberg spatial types](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types).
