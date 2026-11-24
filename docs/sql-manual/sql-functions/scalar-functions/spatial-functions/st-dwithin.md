---
{
    "title": "ST_DWITHIN",
    "language": "en",
    "description": "Tests whether the shortest spherical distance between two spatial values is less than or equal to the threshold, in metres."
}
---

## Description

Tests whether the shortest spherical distance between two Geography values is at most the specified distance in metres. If any argument is NULL, the result is NULL.

## Syntax

```sql
ST_DWITHIN(<a>, <b>, <distance_meters>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<a>`, `<b>` | A nonempty XY Point, LineString, or Polygon with type `GEOGRAPHY('OGC:CRS84', 'spherical')`. |
| `<distance_meters>` | A finite, nonnegative number in metres. Doris converts it to DOUBLE. |

## Return Value

Returns BOOLEAN. A distance less than or equal to the threshold returns `true`. A larger distance returns `false`. NULL inputs return NULL. Negative, NaN, or infinite thresholds raise an error for non-NULL rows.

For lines or polygons, the function raises a precision error if the computed distance is zero and the original coordinates cannot confirm intersection. This applies to zero and positive thresholds.

## Example

The distance between (0, 0) and (1, 0) is greater than 100 km and within 200 km.

```sql
SELECT ST_DWithin(a, b, 100000) AS within_100_km,
       ST_DWithin(a, b, 200000) AS within_200_km
FROM (
    SELECT ST_GeogFromWKB('010100000000000000000000000000000000000000') AS a,
           ST_GeogFromWKB('0101000000000000000000f03f0000000000000000') AS b
) AS points;
```

```text
false  true
```

NULL input:

```sql
SELECT ST_DWithin(NULL, g, 0) FROM (SELECT ST_GeogFromWKB('0101000000000000000000F03F0000000000000040') AS g) values_with_geography;
```

```text
NULL
```

See also: [Iceberg spatial types](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types).
