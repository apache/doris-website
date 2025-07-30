---
{
    "title": "ST_INTERSECTS",
    "language": "en"
}
---

## Description

Determines whether the geometry shape1 intersects with the geometry shape2.

:::info Note
Supported since Apache Doris 2.1.10.
:::

## Syntax

```sql
ST_INTERSECTS( <shape1>, <shape2> )
```

## Parameters

| Parameters | Instructions |
|----------|------------------------|
| `<shape1>` | The passed geometry used to determine whether it intersects with shape2 |
| `<shape2>` | The passed geometry used to determine whether it intersects with shape1 |

## Return Value

Return 1: shape1 The graph intersects with the graph shape2

Return 0: shape1 The graph does not intersect with the graph shape2


## Examples

```sql
SELECT ST_Intersects(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5));
```

```text
+--------------------------------------------------------------------------------------+
| ST_Intersects(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5)) |
+--------------------------------------------------------------------------------------+
|                                                                                    1 |
+--------------------------------------------------------------------------------------+
```

```sql
SELECT ST_Intersects(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50));
```

```text
+----------------------------------------------------------------------------------------+
| ST_Intersects(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50)) |
+----------------------------------------------------------------------------------------+
|                                                                                      0 |
+----------------------------------------------------------------------------------------+
```
