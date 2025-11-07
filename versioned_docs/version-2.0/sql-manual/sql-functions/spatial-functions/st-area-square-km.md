---
{
    "title": "ST_AREA_SQUARE_KM",
    "language": "en"
}
---

## Description

Calculate the area of the region on the sphere of the Earth


## Syntax

```sql
ST_AREA_SQUARE_KM( <geo>)
```

## Parameters

| Parameters | Instructions     |
| -- |--------|
| `<geo>` | The spherical position of the earth |

## Return Value

ST_Area_Square_Km( <geo>):  the units returned are square kilometers

## Examples

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
