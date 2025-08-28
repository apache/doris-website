---
{
    "title": "ST_AREA_SQUARE_KM",
    "language": "en"
}
---

## Description

Calculates the area of a closed region on the Earth's surface in square kilometers. The input parameter is a geometric object (such as a Geopolygon,GeoCircle,GeoMuitiPolygon ) representing a region on the Earth's surface.



## Sytax

```sql
ST_AREA_SQUARE_KM( <geo>)
```
## Parameters

| Parameters | Description     |
| -- |--------|
| `<geo>` | A geometric object on the Earth's surface, of type GeoPolygon,GeoCircle,GeoMultiCircle, must form a closed region.|

## Retuen value

Returns the area of the region in square kilometers, as a DOUBLE type.

Edge cases for ST_AREA_SQUARE_KM:

- Returns NULL if the input parameter is NULL.
- Returns NULL if the input geometry is invalid (e.g., self-intersecting, zero area).
- If the input is a non-closed geometric object (such as point GeoPoint, line segment GeoLineString), returns 0.
- Returns NULL if any coordinate exceeds the valid longitude/latitude range (longitude [-180, 180], latitude [-90, 90]).

## Example

Small square region (small longitude/latitude range),A square region with sides of approximately 1°, resulting in an area of approximately 12,364 square kilometers.

```sql
SELECT ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))"));
```

```text
+----------------------------------------------------------------------+
| st_area_square_km(st_polygon('POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))')) |
+----------------------------------------------------------------------+
|                                                   12364.036567076409 |
+----------------------------------------------------------------------+
```

Larger rectangular region

```sql
mysql> SELECT ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
+--------------------------------------------------------------------------+
| ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")) |
+--------------------------------------------------------------------------+
|                                                       1233204.7035253085 |
+--------------------------------------------------------------------------+

```

Complex polygon with curved edges

```sql
mysql> SELECT ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 5 1, 10 0, 5 -1, 0 0))"));
+------------------------------------------------------------------------+
| ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 5 1, 10 0, 5 -1, 0 0))")) |
+------------------------------------------------------------------------+
|                                                     123725.16642083102 |
+------------------------------------------------------------------------+
```

Region crossing the 180° longitude line

```sql
mysql> SELECT ST_Area_Square_Km(ST_Polygon("POLYGON ((179 0, 180 0, 180 1, 179 1, 179 0))"));
+--------------------------------------------------------------------------------+
| ST_Area_Square_Km(ST_Polygon("POLYGON ((179 0, 180 0, 180 1, 179 1, 179 0))")) |
+--------------------------------------------------------------------------------+
|                                                             12364.036567076282 |
+--------------------------------------------------------------------------------+
```

Region in the Southern Hemisphere

```sql
mysql> SELECT ST_Area_Square_Km(ST_Polygon("POLYGON ((0 -10, 10 -10, 10 -20, 0 -20, 0 -10))"));
+----------------------------------------------------------------------------------+
| ST_Area_Square_Km(ST_Polygon("POLYGON ((0 -10, 10 -10, 10 -20, 0 -20, 0 -10))")) |
+----------------------------------------------------------------------------------+
|                                                               1195196.6541230455 |
+----------------------------------------------------------------------------------+
```

 Invalid polygon (self-intersecting)

```sql
mysql> SELECT ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))"));
+----------------------------------------------------------------------+
| ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 1 1, 0 1, 1 0, 0 0))")) |
+----------------------------------------------------------------------+
|                                                                 NULL |
+----------------------------------------------------------------------+
```

Coordinates exceeding valid range

```sql
mysql> SELECT ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 200 0, 200 1, 0 1, 0 0))"));
+--------------------------------------------------------------------------+
| ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 200 0, 200 1, 0 1, 0 0))")) |
+--------------------------------------------------------------------------+
|                                                                     NULL |
+--------------------------------------------------------------------------+
```

 Null input

```sql
mysql> SELECT ST_Area_Square_Km(NULL);
+-------------------------+
| ST_Area_Square_Km(NULL) |
+-------------------------+
|                    NULL |
+-------------------------+
```


Compute circle area

```sql
mysql> SELECT ST_Area_Square_Km(ST_Circle(0, 0, 1));
+---------------------------------------+
| ST_Area_Square_Km(ST_Circle(0, 0, 1)) |
+---------------------------------------+
|                 3.141592653589787e-06 |
+---------------------------------------+

```

Point object(zero area size)

```sql
SELECT ST_Area_Square_Km(ST_Point(0, 1));
```

```text
+-------------------------------------------+
| st_area_square_Km(st_point(0.0, 1.0)) |
+-------------------------------------------+
|                                         0 |
+-------------------------------------------+
```

Line object(zero area size)

```sql
SELECT ST_Area_Square_Km(ST_LineFromText("LINESTRING (1 1, 2 2)"));
```

```text
+-----------------------------------------------------------------+
| st_area_square_Km(st_linefromtext('LINESTRING (1 1, 2 2)')) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
```

