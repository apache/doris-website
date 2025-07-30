---
{
    "title": "ST_CIRCLE",
    "language": "en"
}
---

## Description

Convert a WKT (Well Known Text) to a circle on the sphere of the Earth.

## Syntax

```sql
ST_CIRCLE( <center_lng>, <center_lat>, <radius>)
```

## Parameters

| Parameters | Instructions |
| -- | -- |
| `<center_lng>` | Longitude of the center of the circle |
| `<center_lat>` | The latitude of the center of the circle |
| `<radius>` | Radius of a circle |

- The unit of radius is meters. A maximum of 9999999 RADIUS is supported

## Return Value

A circle on a sphere based on basic information about the circle

## Examples

```sql
SELECT ST_AsText(ST_Circle(111, 64, 10000));
```

```text
+--------------------------------------------+
| st_astext(st_circle(111.0, 64.0, 10000.0)) |
+--------------------------------------------+
| CIRCLE ((111 64), 10000)                   |
+--------------------------------------------+
```

