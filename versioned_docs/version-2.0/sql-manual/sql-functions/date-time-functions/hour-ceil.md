---
{
    "title": "HOUR_CEIL",
    "language": "en"
}
---

## hour_ceil
### description
#### Syntax

```sql
DATETIME HOUR_CEIL(DATETIME datetime)
DATETIME HOUR_CEIL(DATETIME datetime, DATETIME origin)
DATETIME HOUR_CEIL(DATETIME datetime, INT period)
DATETIME HOUR_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding up time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many hours each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select hour_ceil("2023-07-13 22:28:18", 5);
+------------------------------------------------------------+
| hour_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2023-07-14 02:00:00                                        |
+------------------------------------------------------------+
1 row in set (0.03 sec)
```

### keywords

    HOUR_CEIL, HOUR, CEIL

### Best Practice

See also [date_ceil](./date_ceil)
