---
{
    "title": "ST_CONTAINS",
    "language": "en"
}
---

## Description

Determines whether the geometry shape1 is fully capable of containing the geometry shape2

## Syntax

```sql
ST_CONTAINS( <shape1>, <shape2>)
```

## Parameters

| Parameters | Instructions |
|----------|------------------------|
| `<shape1>` | The passed geometry used to determine whether shape2 is included |
| `<shape2>` | The passed geometry is used to determine whether shape1 is included |

## Return Value

Return 1:shape1 The graph can contain the graph shape2

Return 0:shape1 Graph cannot contain graph shape2


## Examples

```sql
SELECT ST_Contains(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5));
```

```text
+----------------------------------------------------------------------------------------+
| st_contains(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_point(5.0, 5.0)) |
+----------------------------------------------------------------------------------------+
|                                                                                      1 |
+----------------------------------------------------------------------------------------+
```

```sql
SELECT ST_Contains(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50));
```

```text
+------------------------------------------------------------------------------------------+
| st_contains(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_point(50.0, 50.0)) |
+------------------------------------------------------------------------------------------+
|                                                                                        0 |
+------------------------------------------------------------------------------------------+
```
