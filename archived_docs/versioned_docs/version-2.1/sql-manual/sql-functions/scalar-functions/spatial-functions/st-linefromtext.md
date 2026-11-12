---
{
    "title": "ST_LINEFROMTEXT",
    "language": "en",
    "description": "Converts a WKT (Well Known Text) to a memory representation in the form of a Line"
}
---

## Description

Converts a WKT (Well Known Text) to a memory representation in the form of a Line

## Alias

- ST_LINESTRINGFROMTEXT

## Syntax

```sql
ST_LINEFROMTEXT( <wkt>)
```

## Parameters

| Parameters  | Instructions         |
|-----|------------|
| `<wkt>` | A line segment consisting of two coordinates |

## Return Value

The memory form of a line segment.

## Examples

```sql
SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```