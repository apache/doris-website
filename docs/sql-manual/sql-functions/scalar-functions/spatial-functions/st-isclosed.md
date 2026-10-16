---
{
    "title": "ST_ISCLOSED",
    "language": "en",
    "description": "Determines whether a LineString is closed by comparing its first and last points."
}
---

<version since="dev">

</version>

## Description

Determines whether a `LINESTRING` is closed. A `LINESTRING` is closed when its first and last points are exactly equal. This function does not use a distance tolerance.

## Syntax

```sql
ST_ISCLOSED( <shape> )
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<shape>` | An encoded geometry value (`VARCHAR`) returned by a spatial constructor such as `ST_GeometryFromText` or `ST_LineFromText`. Raw WKT text must first be converted with a constructor. |

## Return Value

Returns a BOOLEAN value:

- `true` if the input is a valid `LINESTRING` whose first and last points are exactly equal.
- `false` if the input is a valid `LINESTRING` whose first and last points are different.
- `NULL` if the input is `NULL`, is not a `LINESTRING`, or cannot be decoded as a valid geometry.

In SQL output, `true` is displayed as `1` and `false` as `0`.

## Example

**Closed LineString**

```sql
SELECT ST_IsClosed(
    ST_GeometryFromText('LINESTRING(0 0, 1 1, 0 0)')
) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|         1 |
+-----------+
```

**Open LineString**

```sql
SELECT ST_IsClosed(
    ST_GeometryFromText('LINESTRING(0 0, 1 1)')
) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|         0 |
+-----------+
```

**NULL Input**

```sql
SELECT ST_IsClosed(NULL) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|      NULL |
+-----------+
```

**Non-LineString Input**

```sql
SELECT ST_IsClosed(ST_Point(0, 0)) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|      NULL |
+-----------+
```
