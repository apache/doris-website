---
{
    "title": "ST_GEOMETRYFROMTEXT",
    "language": "en"
}
---

## Description

Convert a linear WKT (Well Known Text) to the corresponding memory geometry


## Alias

- ST_GEOMFROMTEXT

## Syntax

```sql
ST_GEOMETRYFROMTEXT( <wkt>)
```
## Parameters

| Parameters | Instructions |
| -- |---------|
| `<wkt>` | The memory form of the graph |

## Return Value

The corresponding geometric storage form of WKB

## Examples

```sql
SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```