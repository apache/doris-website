---
{
    "title": "DAY_FLOOR",
    "language": "en",
    "description": "Rounds the date down to the nearest timestamp of the specified time interval period."
}
---

## Description

Rounds the date down to the nearest timestamp of the specified time interval period.

## Syntax

```sql
DAY_FLOOR(<datetime>)
DAY_FLOOR(<datetime>, <origin>)
DAY_FLOOR(<datetime>, <period>)
DAY_FLOOR(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<datetime>` | A valid date expression |
| `<period>` | Specifies how many days make up each period |
| `<origin>` | The starting point of time. If not provided, the default is 0001-01-01T00:00:00 |

## Return Value

Returns the date of the nearest rounded-up timestamp.

## Examples

```sql
select day_floor("2023-07-13 22:28:18", 5);
```

```text
+------------------------------------------------------------+
| day_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2023-07-12 00:00:00                                        |
+------------------------------------------------------------+
```
