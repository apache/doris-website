---
{
    "title": "YEAR_CEIL",
    "language": "en"
}
---

## year_ceil
### description
#### Syntax

```sql
DATETIME YEAR_CEIL(DATETIME datetime)
DATETIME YEAR_CEIL(DATETIME datetime, DATETIME origin)
DATETIME YEAR_CEIL(DATETIME datetime, INT period)
DATETIME YEAR_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding up time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many years each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select year_ceil("2023-07-13 22:28:18", 5);
+------------------------------------------------------------+
| year_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2025-01-01 00:00:00                                        |
+------------------------------------------------------------+
1 row in set (0.02 sec)
```

### keywords

    YEAR_CEIL, YEAR, CEIL

### Best Practice

See also [date_ceil](./date_ceil)
