---
{
    "title": "DAYS_SUB",
    "language": "en",
    "description": "Subtracts a specified time interval to the date."
}
---

## Description

Subtracts a specified time interval to the date.

## Alias

## 别名

- days_sub
- date_sub
- subdate

## Syntax

```sql
DATE_SUB(<date>, <expr> <time_unit>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date>` | A valid date value |
| `<expr>`| The time interval you want to subtract |
| `<type>` | Enumerated values: YEAR, MONTH, DAY, HOUR, MINUTE, SECOND |

## Return Value

Returns the calculated date.

## Examples

```sql
select date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY);
```

```text
+-------------------------------------------------+
| date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-11-28 23:59:59                             |
+-------------------------------------------------+
```
