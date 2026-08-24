---
{
    "title": "ST_YMAX",
    "language": "en",
    "description": "Returns the maximum Y (latitude) coordinate of the bounding box of a geometry."
}
---

## Description

Returns the maximum Y (latitude) coordinate of the bounding box of a geometry.

## Syntax

```sql
ST_YMAX( <geometry>)
```

## Parameters

| Parameter | Description |
|------|----------|
| `<geometry>` | The geometry object from which to extract the maximum Y coordinate of the bounding box. |

## Return Value

The the maximum Y coordinate of the bounding box, of type double-precision floating-point number (Double).

- Returns the maximum Y coordinate of the bounding box if the input is a valid geometry object.
- Returns NULL if the input is NULL or an invalid geometry (e.g., a non-geometry string).

## Example

Extract the maximum Y coordinate of the bounding box of a point

```sql
SELECT ST_YMax(ST_Point(24.7, 56.7));
```

```text
+---------------------------------+
| ST_YMax(st_point(24.7, 56.7)) |
+---------------------------------+
|                            24.7 |
+---------------------------------+
```

Extract the maximum Y coordinate of the bounding box of a linestring

```sql
SELECT ST_YMax(ST_LineStringFromText('LINESTRING (0 0, 4 4)'));
```

```text
+---------------------------------------------------------+
| ST_YMax(st_linestringfromtext('LINESTRING (0 0, 4 4)')) |
+---------------------------------------------------------+
|                                                       4 |
+---------------------------------------------------------+
```

Extract the maximum Y coordinate of the bounding box of a polygon

```sql
SELECT ST_YMax(ST_Polygon('POLYGON ((0 0, 4 0, 4 3, 0 3, 0 0))'));
```

```text
+------------------------------------------------------------------+
| ST_YMax(st_polygon('POLYGON ((0 0, 4 0, 4 3, 0 3, 0 0))')) |
+------------------------------------------------------------------+
|                                                                4 |
+------------------------------------------------------------------+
```

Input is an invalid geometry

```sql
SELECT ST_YMax('not a geometry');
```

```text
+------------------------------------------+
| ST_YMax('not a geometry') |
+------------------------------------------+
|                                     NULL |
+------------------------------------------+
```

Input is NULL

```sql
SELECT ST_YMax(NULL);
```

```text
+-------------------------+
| ST_YMax(null) |
+-------------------------+
|                    NULL |
+-------------------------+
```
