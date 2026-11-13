---
{
    "title": "ST_OVERLAPS",
    "language": "en",
    "description": "Tests partial overlap of equal-dimensional spatial values: their interiors must intersect in that dimension, and neither value may fully cover the other."
}
---

## Description

Tests partial overlap of equal-dimensional spatial values: their interiors must intersect in that dimension, and neither value may fully cover the other. A point crossing of lines, polygons sharing only an edge or vertex, equality, containment, different dimensions, and single Point/Point inputs return false. The relation is symmetric.

The development-version typed interface accepts nonempty XY Point, LineString and Polygon values with default `GEOGRAPHY(OGC:CRS84, spherical)` semantics. Geometry, other CRS/algorithms, Z/M, Multi*/GeometryCollection and EMPTY are not supported for calculations; valid raw values remain available for storage and access. NULL arguments return NULL. Edges are spherical geodesics, with the existing smaller-region polygon-ring interpretation. No spatial index or predicate pushdown is provided.

## Syntax

```sql
ST_OVERLAPS(<a>, <b>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `a`, `b` | GEOGRAPHY values with their complete type parameters. |

## Return Value

Nullable BOOLEAN.

## Example

```sql
SELECT ST_Overlaps(g, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
false
```

NULL input:

```sql
SELECT ST_Overlaps(NULL, g) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
NULL
```

See also: [Iceberg spatial types](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types).
