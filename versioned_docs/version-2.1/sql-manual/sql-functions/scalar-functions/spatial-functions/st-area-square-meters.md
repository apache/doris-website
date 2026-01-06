---
{
    "title": "ST_AREA_SQUARE_METERS",
    "language": "en",
    "description": "Calculate the area of the region on the sphere of the Earth"
}
---

## Description

Calculate the area of the region on the sphere of the Earth


## Syntax

```sql
ST_AREA_SQUARE_METERS( <geo>)
```

## Parameters

| Parameters | Instructions     |
| -- |--------|
| `<geo>` | The spherical position of the earth |

## Return Value

ST_Area_Square_Meters( <geo>): the units returned are square meters

## Examples

```sql
SELECT ST_Area_Square_Meters(ST_Circle(0, 0, 1));
```

```text
+-------------------------------------------------+
| st_area_square_meters(st_circle(0.0, 0.0, 1.0)) |
+-------------------------------------------------+
|                              3.1415926535897869 |
+-------------------------------------------------+
```


```sql
SELECT ST_Area_Square_Meters(ST_Point(0, 1));
```

```text
+-------------------------------------------+
| st_area_square_meters(st_point(0.0, 1.0)) |
+-------------------------------------------+
|                                         0 |
+-------------------------------------------+
```

```sql
SELECT ST_Area_Square_Meters(ST_LineFromText("LINESTRING (1 1, 2 2)"));
```

```text
+-----------------------------------------------------------------+
| st_area_square_meters(st_linefromtext('LINESTRING (1 1, 2 2)')) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
```

