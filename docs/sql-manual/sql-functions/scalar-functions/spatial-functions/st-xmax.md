---
{
    "title": "ST_XMAX",
    "language": "en",
    "description": "Returns the maximum X (longitude) coordinate of the bounding box of a geometry."
}
---

## Description

Returns the maximum X (longitude) coordinate of the bounding box of a geometry.

## Syntax

```sql
ST_XMAX( <geometry>)
```

## Parameters

| Parameter | Description |
|------|----------|
| `<geometry>` | The geometry object from which to extract the maximum X coordinate of the bounding box. |

## Return Value

The the maximum X coordinate of the bounding box, of type double-precision floating-point number (Double).

- Returns the maximum X coordinate of the bounding box if the input is a valid geometry object.
- Returns NULL if the input is NULL or an invalid geometry (e.g., a non-geometry string).

## Example

Extract the maximum X coordinate of the bounding box of a point

```sql
SELECT ST_XMax(ST_Point(24.7, 56.7));
```

```text
+---------------------------------+
| ST_XMax(st_point(24.7, 56.7)) |
+---------------------------------+
|                            24.7 |
+---------------------------------+
```

Extract the maximum X coordinate of the bounding box of a linestring

```sql
SELECT ST_XMax(ST_LineStringFromText('LINESTRING (0 0, 4 4)'));
```

```text
+---------------------------------------------------------+
| ST_XMax(st_linestringfromtext('LINESTRING (0 0, 4 4)')) |
+---------------------------------------------------------+
|                                                       4 |
+---------------------------------------------------------+
```

Extract the maximum X coordinate of the bounding box of a polygon

```sql
SELECT ST_XMax(ST_Polygon('POLYGON ((0 0, 4 0, 4 3, 0 3, 0 0))'));
```

```text
+------------------------------------------------------------------+
| ST_XMax(st_polygon('POLYGON ((0 0, 4 0, 4 3, 0 3, 0 0))')) |
+------------------------------------------------------------------+
|                                                                4 |
+------------------------------------------------------------------+
```

Input is an invalid geometry

```sql
SELECT ST_XMax('not a geometry');
```

```text
+------------------------------------------+
| ST_XMax('not a geometry') |
+------------------------------------------+
|                                     NULL |
+------------------------------------------+
```

Input is NULL

```sql
SELECT ST_XMax(NULL);
```

```text
+-------------------------+
| ST_XMax(null) |
+-------------------------+
|                    NULL |
+-------------------------+
```
