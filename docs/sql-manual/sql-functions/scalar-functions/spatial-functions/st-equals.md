---
{
    "title": "ST_EQUALS",
    "language": "en",
    "description": "Tests whether two spatial values have the same dimension and occupy the same point set."
}
---

## Description

Tests whether two Geography values of the same dimension cover the same points. Differences in WKB byte order, line direction, subdivision along the same geodesic, and the starting point or direction of a polygon ring do not change equality. If either argument is NULL, the result is NULL.

## Syntax

```sql
ST_EQUALS(<a>, <b>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<a>`, `<b>` | A nonempty XY Point, LineString, or Polygon with type `GEOGRAPHY('OGC:CRS84', 'spherical')`. |

## Return Value

Returns BOOLEAN. Equal point sets return `true`. Different point sets or different dimensions return `false`. NULL inputs return NULL.

## Example

The points `(180, 0)` and `(-180, 0)` represent the same location on the antimeridian.

```sql
SELECT ST_Equals(
    ST_GeogFromWKB('010100000000000000008066400000000000000000'),
    ST_GeogFromWKB('010100000000000000008066c00000000000000000')
) AS same_point;
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
