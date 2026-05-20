---
{
    "title": "ST_LINEFROMTEXT",
    "language": "en",
    "description": "Converts a WKT (Well Known Text) string into an in-memory representation of a Line"
}
---

## Description

Converts a WKT (Well Known Text) string into an in-memory representation of a Line

## Alias

- ST_LINESTRINGFROMTEXT

## Syntax

```sql
ST_LINEFROMTEXT( <wkt>)
```

## Parameters

| Parameters  | Description         |
|-----|------------|
| `<wkt>` | A WKT string conforming to the LINESTRING type, formatted as:
"LINESTRING (x1 y1, x2 y2)"
Where (x1 y1), (x2 y2) are the vertex coordinates of the line segment. Coordinate values are numeric (integers or decimals). |

## Return value

Returns a geometric object of type Line, which is stored in memory in Doris's internal spatial data format. It can be directly passed as a parameter to other spatial functions (such as ST_LENGTH, ST_INTERSECTS, etc.) for calculations.

- Returns NULL if the input WKT string is invalid (e.g., fewer than 2 vertices, syntax errors, non-numeric coordinates, etc.).
- Returns NULL if <wkt> is NULL or an empty string.

## Example


Normal LINE type

```sql
mysql> SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
+-----------------------------------------------------+
| ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)")) |
+-----------------------------------------------------+
| LINESTRING (1 1, 2 2)                               |
+-----------------------------------------------------+
```

Invalid WKT (insufficient vertices)

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1)");
+-------------------------------------+
| ST_LineFromText("LINESTRING (1 1)") |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

Invalid WKT (syntax error)

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1, 2 2");
+-----------------------------------------+
| ST_LineFromText("LINESTRING (1 1, 2 2") |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+
```

LineString with multiple vertices

```sql
mysql> SELECT ST_AsText(ST_LineFromText('LINESTRING (1 1, 2 2)'));
+-----------------------------------------------------+
| ST_AsText(ST_LineFromText('LINESTRING (1 1, 2 2)')) |
+-----------------------------------------------------+
| LINESTRING (1 1, 2 2)                               |
+-----------------------------------------------------+
```

Input NULL

```sql
mysql> SELECT ST_LineFromText(NULL);
+-----------------------+
| ST_LineFromText(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```
