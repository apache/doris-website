---
{
    "title": "ST_X",
    "language": "en"
}
---

## Description

When point is a valid POINT type, return the corresponding x-coordinate value

## Syntax

```sql
ST_X( <point>)
```

## Parameters

| Parameters | Instructions |
|------|----------|
| `<point>` | The geometric coordinates of a two-dimensional point |

## Return Value

X value in geometric coordinates

## Examples

```sql
SELECT ST_X(ST_Point(24.7, 56.7));
```

```text
+----------------------------+
| st_x(st_point(24.7, 56.7)) |
+----------------------------+
|                       24.7 |
+----------------------------+
```