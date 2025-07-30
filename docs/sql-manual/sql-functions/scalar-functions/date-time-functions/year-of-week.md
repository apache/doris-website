---
{
    "title": "YEAR_OF_WEEK",
    "language": "en"
}
---

## year

year_of_week

## Description

Return to the `ISO week date` standard year, please refer to [ISO Week date](https://en.wikipedia.org/wiki/ISO_week_date).

## Alias

- yow

## Syntax

```sql
SMALLINT year_of_week(DATE value)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<value>` | A date for calculate the year of week |

## 返回值

Return to the `ISO week date` standard year

## example

```
mysql> select year_of_week('2005-01-01');
+-----------------------------+
| year_of_week('2005-01-01')  |
+-----------------------------+
|                        2004 |
+-----------------------------+
```

### keywords
    YEAR_OF_WEEK
