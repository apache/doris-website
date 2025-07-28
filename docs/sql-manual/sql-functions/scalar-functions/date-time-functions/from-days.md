---
{
    "title": "FROM_DAYS",
    "language": "en"
}
---

## Description

Given a number of days, returns a DATE.

- Note: To maintain consistent behavior with MySQL, the date 0000-02-29 does not exist.

## Syntax

```sql
FROM_DAYS(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<dt>`| Days |

## Return Value

Returns the date corresponding to the given number of days.

## Examples

```sql
select from_days(730669),from_days(5),from_days(59), from_days(60);
```

```text
+-------------------+--------------+---------------+---------------+
| from_days(730669) | from_days(5) | from_days(59) | from_days(60) |
+-------------------+--------------+---------------+---------------+
| 2000-07-03        | 0000-01-05   | 0000-02-28    | 0000-03-01    |
+-------------------+--------------+---------------+---------------+
```