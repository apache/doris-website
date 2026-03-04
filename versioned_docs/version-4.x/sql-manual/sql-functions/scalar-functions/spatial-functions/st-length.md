---
{
    "title": "ST_LENGTH",
    "language": "en",
    "description": "Returns the length (or perimeter) of a line or surface geometry object. The unit is meters."
}
---

## Description

Returns the spherical length of a line geometry object or the boundary perimeter of a surface geometry object, in meters. This function uses a spherical Earth model for calculation.
- For `LINESTRING` or `MULTILINESTRING`, returns the sum of the great-circle distances of all its segments on the sphere, i.e., the **length** of the line object.
- For `POLYGON` or `MULTIPOLYGON`, returns the sum of the great-circle distances of its outer boundary and inner boundaries (holes) on the sphere, i.e., the **perimeter** of the surface object.
- For `CIRCLE`, returns its circumference, calculated by the formula `2 * π * radius`.
- For `POINT`, returns `0.0`.

:::info Note
Supported since Apache Doris 4.0.4
:::

## Syntax

```sql
ST_LENGTH( <shape> )
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<shape>` | The input geometry, of type GEOMETRY or VARCHAR (in WKT format) that can be converted to GEOMETRY. Supports types such as `LINESTRING`, `POLYGON`, `CIRCLE`, `POINT`. |

## Return Value

Returns the length or perimeter of the geometry object, in meters (DOUBLE type).

`ST_LENGTH` has the following edge cases:
- If the input parameter is `NULL`, returns `NULL`.
- If the input parameter cannot be parsed into a valid geometry object, returns `NULL`.
- If the input geometry object is a `POINT` or a line of zero length, returns `0.0`.
- For the `CIRCLE` type, the radius parameter when created with `ST_CIRCLE` must be in meters to ensure the correct circumference (in meters) is returned.

## Example

**Calculate the Length of a Line (LINESTRING)**
```sql
-- Calculate the length of a line segment with a 1-degree longitude difference on the equator
SELECT ST_LENGTH(ST_GeometryFromText('LINESTRING(0 0, 1 0)'));
```
```text
+--------------------------------------------------------+
| ST_LENGTH(ST_GeometryFromText('LINESTRING(0 0, 1 0)')) |
+--------------------------------------------------------+
|                                      111195.1011774839 |
+--------------------------------------------------------+
```

**Calculate the Perimeter of a Polygon (POLYGON)**
```sql
-- Calculate the perimeter of a small square with a side length of approximately 0.0009 degrees (~100 meters)
SELECT ST_LENGTH(ST_GeometryFromText('POLYGON((-0.00045 -0.00045, 0.00045 -0.00045, 0.00045 0.00045, -0.00045 0.00045, -0.00045 -0.00045))')) AS perimeter;
```
```text
+-------------------+
| perimeter         |
+-------------------+
| 400.3023642327689 |
+-------------------+
```

**Calculate the Circumference of a Circle (CIRCLE)**
```sql
-- Calculate the circumference of a circle with a radius of 100 meters
SELECT ST_LENGTH(ST_Circle(0, 0, 100));
```
```text
+---------------------------------+
| ST_LENGTH(ST_Circle(0, 0, 100)) |
+---------------------------------+
|               628.3185307179587 |
+---------------------------------+
```

**Length of a Point**
```sql
SELECT ST_LENGTH(ST_GeometryFromText('POINT(1 1)'));
```
```text
+----------------------------------------------+
| ST_LENGTH(ST_GeometryFromText('POINT(1 1)')) |
+----------------------------------------------+
|                                            0 |
+----------------------------------------------+
```

**Invalid Parameter (Returns NULL)**
```sql
SELECT ST_LENGTH('NOT_A_GEOMETRY');
```
```text
+-----------------------------+
| ST_LENGTH('NOT_A_GEOMETRY') |
+-----------------------------+
|                        NULL |
+-----------------------------+
```

**NULL Parameter**
```sql
SELECT ST_LENGTH(NULL);
```
```text
+-----------------+
| ST_LENGTH(NULL) |
+-----------------+
|            NULL |
+-----------------+
```

**Length of a Complex Line Object**
```sql
-- Calculate the total length of a polyline
SELECT ST_LENGTH(ST_LineFromText("LINESTRING (0 0,1 0,1 1)"));
```
```text
+--------------------------------------------------------+
| ST_LENGTH(ST_LineFromText("LINESTRING (0 0,1 0,1 1)")) |
+--------------------------------------------------------+
|                                      222390.2023549679 |
+--------------------------------------------------------+
```