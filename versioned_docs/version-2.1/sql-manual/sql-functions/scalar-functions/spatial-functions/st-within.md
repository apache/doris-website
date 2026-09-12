---
{
    "title": "ST_WITHIN",
    "language": "en",
    "description": "Determines whether the geometry shape1 is fully inside the geometry shape2"
}
---

## Description

Determines whether the geometry shape1 is fully inside the geometry shape2

## Syntax

```sql
ST_WITHIN( <shape1>, <shape2>)
```

## Parameters

| Parameters | Instructions |
|----------|------------------------|
| `<shape1>` | The passed geometry used to determine whether it is inside shape2 |
| `<shape2>` | The passed geometry used to determine whether it contains shape1 |

## Return Value

Return 1:shape1 is fully inside shape2

Return 0:shape1 is not inside shape2


## Examples

```sql
SELECT ST_Within(ST_Point(5, 5), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+-------------------------------------------------------------------------------------+
| st_within(st_point(5.0, 5.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+-------------------------------------------------------------------------------------+
|                                                                                   1 |
+-------------------------------------------------------------------------------------+
```

```sql
SELECT ST_Within(ST_Point(50, 50), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+---------------------------------------------------------------------------------------+
| st_within(st_point(50.0, 50.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+---------------------------------------------------------------------------------------+
|                                                                                     0 |
+---------------------------------------------------------------------------------------+
```
