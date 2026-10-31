---
{
    "title": "ST_POINT",
    "language": "en",
    "description": "With the given X coordinate value, the Y coordinate value returns the corresponding Point."
}
---

## Description

With the given X coordinate value, the Y coordinate value returns the corresponding Point.

The current value is only meaningful in the sphere set, X/Y corresponds to longitude/latitude;

## Syntax

```sql
ST_POINT( <x>, <y>)
```
## Parameters

| Parameters | Instructions |
|-----|--------------|
| `<x>` | x-coordinate |
| `<y>` | y-coordinate |

## Return Value

Given horizontal coordinate and vertical coordinate corresponding position information

## Examples

```sql
SELECT ST_AsText(ST_Point(24.7, 56.7));
```

```text
+---------------------------------+
| st_astext(st_point(24.7, 56.7)) |
+---------------------------------+
| POINT (24.7 56.7)               |
+---------------------------------+
```