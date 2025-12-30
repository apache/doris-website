---
{
    "title": "HOUR_FLOOR",
    "language": "en",
    "description": "Converts the date to the nearest rounded-down timestamp of the specified time interval period."
}
---

## Description

Converts the date to the nearest rounded-down timestamp of the specified time interval period.

## Syntax

```sql
HOUR_FLOOR(<datetime>)
HOUR_FLOOR(<datetime>, <origin>)
HOUR_FLOOR(<datetime>, <period>)
HOUR_FLOOR(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<datetime>` | A valid date expression |
| `<period>` | Specifies how many hours make up each period|
| `<origin>` | The starting point of time. If not provided, the default is 0001-01-01T00:00:00 |

## Return Value

Returns the nearest rounded-down timestamp of the specified time interval period.

## Examples

```sql
select hour_floor("2023-07-13 22:28:18", 5);
```

```text
+-------------------------------------------------------------+
| hour_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+-------------------------------------------------------------+
| 2023-07-13 21:00:00                                         |
+-------------------------------------------------------------+
```

