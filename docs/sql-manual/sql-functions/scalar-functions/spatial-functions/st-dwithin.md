---
{
    "title": "ST_DWITHIN",
    "language": "en",
    "description": "Tests whether the shortest spherical distance between two spatial values is less than or equal to the threshold, in metres."
}
---

## Description

Tests whether the shortest spherical distance between two spatial values is less than or equal to the threshold, in metres. The threshold uses numeric-to-DOUBLE coercion; negative, NaN and infinite thresholds on non-NULL rows raise an error. Any NULL argument produces NULL. Only the three-argument form is supported, with no spheroidal mode or user-specified snapping tolerance.

The development-version typed interface accepts nonempty XY Point, LineString and Polygon values with default `GEOGRAPHY(OGC:CRS84, spherical)` semantics. Geometry, other CRS/algorithms, Z/M, Multi*/GeometryCollection and EMPTY are not supported for calculations; valid raw values remain available for storage and access. NULL arguments return NULL. Edges are spherical geodesics, with the existing smaller-region polygon-ring interpretation. No spatial index or predicate pushdown is provided.

## Syntax

```sql
ST_DWITHIN(a, b, distance_meters)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `a`, `b` | GEOGRAPHY values with their complete type parameters. |
| `distance_meters` | Finite nonnegative distance threshold, in metres. |

## Return value

Nullable BOOLEAN.

## Example

```sql
SELECT ST_DWithin(g, g, 0) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
true
```

See also: [Iceberg spatial types](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types).
