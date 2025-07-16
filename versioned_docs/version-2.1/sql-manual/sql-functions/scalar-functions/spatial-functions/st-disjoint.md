---
{
    "title": "ST_DISJOINT",
    "language": "en"
}
---

## Description

Determines whether the geometry shape1 does not intersect with the geometry shape2.

:::info Note
Supported since Apache Doris 2.1.10.
:::

## Syntax

```sql
ST_DISJOINT( <shape1>, <shape2> )
```

## Parameters

| Parameters | Instructions |
|----------|------------------------|
| `<shape1>` | The passed geometry used to determine whether it does not intersect with shape2 |
| `<shape2>` | The passed geometry used to determine whether it does not intersect with shape1 |

## Return Value

Return 1: shape1 The graph does not intersect with the graph shape2

Return 0: shape1 The graph intersects with the graph shape2


## Examples

```sql
SELECT ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5));
```

```text
+------------------------------------------------------------------------------------+
| ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5)) |
+------------------------------------------------------------------------------------+
|                                                                                  0 |
+------------------------------------------------------------------------------------+
```

```sql
SELECT ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50));
```

```text
+--------------------------------------------------------------------------------------+
| ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50)) |
+--------------------------------------------------------------------------------------+
|                                                                                    1 |
+--------------------------------------------------------------------------------------+
```
