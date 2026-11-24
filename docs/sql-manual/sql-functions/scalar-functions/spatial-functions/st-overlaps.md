---
{
    "title": "ST_OVERLAPS",
    "language": "en",
    "description": "Tests partial overlap of equal-dimensional spatial values: their interiors must intersect in that dimension, and neither value may fully cover the other."
}
---

## Description

Tests whether two Geography values of the same dimension overlap in part. Their interiors must intersect in that dimension, and each value must have some points outside the other. If either argument is NULL, the result is NULL.

## Syntax

```sql
ST_OVERLAPS(<a>, <b>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<a>`, `<b>` | A nonempty XY Point, LineString, or Polygon with type `GEOGRAPHY('OGC:CRS84', 'spherical')`. |

## Return Value

Returns BOOLEAN. Partial overlap returns `true`. Different dimensions, identical values, full containment, and two single points return `false`. Lines that cross only at a point and polygons that share only an edge or vertex also return `false`. NULL inputs return NULL.

## Example

The lines (0, 0)–(2, 0) and (1, 0)–(3, 0) overlap along part of their length.

```sql
SELECT ST_Overlaps(
    ST_GeogFromWKB('0102000000020000000000000000000000000000000000000000000000000000400000000000000000'),
    ST_GeogFromWKB('010200000002000000000000000000f03f000000000000000000000000000008400000000000000000')
) AS overlaps;
```

```text
true
```

One point has no partial overlap with itself.

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
