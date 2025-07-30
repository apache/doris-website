---
{
    "title": "HOUR_CEIL",
    "language": "en"
}
---

## Description

Converts the date to the nearest rounded-up timestamp of the specified time interval period.

## Syntax

```sql
HOUR_CEIL(<datetime>)
HOUR_CEIL(<datetime>, <origin>)
HOUR_CEIL(<datetime>, <period>)
HOUR_CEIL(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<datetime>` | A valid date expression |
| `<period>`| Specifies how many hours make up each period|
| `<origin>` | The starting point of time. If not provided, the default is 0001-01-01T00:00:00 |

## Return Value

Returns the nearest rounded-up timestamp of the specified time interval period.

## Examples

```sql
select hour_ceil("2023-07-13 22:28:18", 5);
```

```text
+------------------------------------------------------------+
| hour_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2023-07-14 02:00:00                                        |
+------------------------------------------------------------+
```