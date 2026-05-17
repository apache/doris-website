---
{
    "title": "ST_GEOMETRYTYPE",
    "language": "en",
    "description": "Returns the type name of a geometry object."
}
---

## Description

Returns the type name (in uppercase) of a given geometry object. Used to identify the specific type of a geometric shape.

## Syntax

```sql
ST_GEOMETRYTYPE( <shape> )
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<shape>` | The input geometry, of type GEOMETRY or VARCHAR (in WKT format) that can be converted to GEOMETRY. |

## Return Value

Returns a VARCHAR type uppercase string representing the geometry object's type.

`ST_GEOMETRYTYPE` has the following edge cases:
-   If the input parameter is `NULL`, returns `NULL`.
-   If the input parameter cannot be parsed into a valid geometry object, returns `NULL`.
-   Supported geometry types and their return value examples are as follows:
    -   `POINT`: `"ST_POINT"`
    -   `LINESTRING`: `"ST_LINESTRING"`
    -   `POLYGON`: `"ST_POLYGON"`
    -   `MULTIPOLYGON`: `"ST_MULTIPOLYGON"`
    -   `CIRCLE` : `"ST_CIRCLE"`

## Example

**Type of a Point**
```sql
SELECT ST_GEOMETRYTYPE(ST_GeometryFromText('POINT(1 1)'));
```
```text
+----------------------------------------------------+
| ST_GEOMETRYTYPE(ST_GeometryFromText('POINT(1 1)')) |
+----------------------------------------------------+
| ST_POINT                                           |
+----------------------------------------------------+
```

**Type of a Line**
```sql
SELECT ST_GEOMETRYTYPE(ST_LineFromText("LINESTRING (1 1,2 2,3 3)"));
```
```text
+--------------------------------------------------------------+
| ST_GEOMETRYTYPE(ST_LineFromText("LINESTRING (1 1,2 2,3 3)")) |
+--------------------------------------------------------------+
| ST_LINESTRING                                                |
+--------------------------------------------------------------+
```

**Type of a Polygon**
```sql
SELECT ST_GEOMETRYTYPE(ST_GeometryFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))'));
```
```text
+--------------------------------------------------------------------------------+
| ST_GEOMETRYTYPE(ST_GeometryFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+--------------------------------------------------------------------------------+
| ST_POLYGON                                                                     |
+--------------------------------------------------------------------------------+
```

**Type of a Circle (Doris Extension)**
```sql
SELECT ST_GEOMETRYTYPE(ST_Circle(0, 0, 100));
```
```text
+---------------------------------------+
| ST_GEOMETRYTYPE(ST_Circle(0, 0, 100)) |
+---------------------------------------+
| ST_CIRCLE                             |
+---------------------------------------+
```

**Invalid Parameter (Returns NULL)**
```sql
SELECT ST_GEOMETRYTYPE('NOT_A_GEOMETRY');
```
```text
+-----------------------------------+
| ST_GEOMETRYTYPE('NOT_A_GEOMETRY') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+
```

**NULL Parameter**
```sql
SELECT ST_GEOMETRYTYPE(NULL);
```
```text
+-----------------------+
| ST_GEOMETRYTYPE(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```