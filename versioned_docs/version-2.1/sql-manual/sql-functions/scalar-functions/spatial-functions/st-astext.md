---
{
    "title": "ST_ASTEXT",
    "language": "en"
}
---

## Description

Convert a geometric figure to a representation of WKT (Well Known Text)

## Alias

- ST_ASWKT

## Syntax

```sql
ST_ASTEXT(GEOMETRY <geo>)
```

## Parameters

| Parameters | Instructions |
| -- |----------|
| `<geo>` | The graph that needs to be converted |

## Return Value

The WKT representation of the geometry:

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
