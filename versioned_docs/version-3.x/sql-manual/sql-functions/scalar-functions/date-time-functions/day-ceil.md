---
{
    "title": "DAY_CEIL",
    "language": "en",
    "description": "Rounds the date up to the nearest specified time interval period."
}
---

## Description

Rounds the date up to the nearest specified time interval period.

## Syntax

```sql
DAY_CEIL(<datetime>)
DAY_CEIL(<datetime>, <origin>)
DAY_CEIL(<datetime>, <period>)
DAY_CEIL(<datetime>, <period>, <origin>)
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
select day_ceil("2023-07-13 22:28:18", 5);
```

```text
+-----------------------------------------------------------+
| day_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+-----------------------------------------------------------+
| 2023-07-17 00:00:00                                       |
+-----------------------------------------------------------+
```
