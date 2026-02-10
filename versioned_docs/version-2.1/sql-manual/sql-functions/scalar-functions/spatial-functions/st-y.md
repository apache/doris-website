---
{
    "title": "ST_Y",
    "language": "en",
    "description": "When point is a valid POINT type, return the corresponding y-coordinate value"
}
---

## Description

When point is a valid POINT type, return the corresponding y-coordinate value

## Syntax

```sql
ST_Y( <point>)
```

## Parameters

| Parameters | Instructions |
|------|----------|
| `<point>` | The geometric coordinates of a two-dimensional point |

## Return Value

Y value in geometric coordinates

## Examples

```sql
SELECT ST_Y(ST_Point(24.7, 56.7));
```

```text
+----------------------------+
| ST_Y(ST_Point(24.7, 56.7)) |
+----------------------------+
| 56.7                       |
+----------------------------+
```