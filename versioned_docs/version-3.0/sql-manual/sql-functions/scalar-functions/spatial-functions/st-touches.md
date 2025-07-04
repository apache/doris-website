---
{
    "title": "ST_TOUCHES",
    "language": "en"
}
---

## Description

Determines whether the geometry shape1 touches the geometry shape2. (i.e., whether the boundaries of the two geometries intersect but their interiors do not)

:::info Note
Supported since Apache Doris 3.0.6.
:::

## Syntax

```sql
ST_TOUCHES( <shape1>, <shape2> )
```

## Parameters

| Parameters | Instructions |
|----------|------------------------|
| `<shape1>` | The passed geometry used to determine whether it touches shape2 |
| `<shape2>` | The passed geometry used to determine whether it touches shape1 |

## Return Value

Return 1: shape1 The graph touches the graph shape2

Return 0: shape1 The graph does not touch the graph shape2


## Examples

```sql
SELECT ST_Touches(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_LineStringFromText("LINESTRING (10 5, 15 5)"));
```

```text
+---------------------------------------------------------------------------------------------------------------------+
| ST_Touches(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_LineStringFromText("LINESTRING (10 5, 15 5)")) |
+---------------------------------------------------------------------------------------------------------------------+
|                                                                                                                   1 |
+---------------------------------------------------------------------------------------------------------------------+
```

```sql
SELECT ST_Touches(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_LineStringFromText("LINESTRING (5 5, 15 5)"));
```

```text
+--------------------------------------------------------------------------------------------------------------------+
| ST_Touches(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_LineStringFromText("LINESTRING (5 5, 15 5)")) |
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                  0 |
+--------------------------------------------------------------------------------------------------------------------+
```
