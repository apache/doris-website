---
{
    "title": "DAYS_ADD",
    "language": "en"
}
---

## Description

Add a specified time interval to the date.

## Alias

- date_add
- days_add
- adddate

## Syntax

```sql
DATE_ADD(<date>, <expr> <time_unit>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date>` | A valid date value |
| `<expr>` | The time interval you want to add |
| `<time_unit>` | Enumerated values: YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND |

## Return Value

Returns the calculated date.

## Examples

```sql
select date_add('2010-11-30 23:59:59', INTERVAL 2 DAY);
```

```text
+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+
```