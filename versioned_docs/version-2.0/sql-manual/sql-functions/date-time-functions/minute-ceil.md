---
{
    "title": "MINUTE_CEIL",
    "language": "en"
}
---

## minute_ceil
### description
#### Syntax

```sql
DATETIME MINUTE_CEIL(DATETIME datetime)
DATETIME MINUTE_CEIL(DATETIME datetime, DATETIME origin)
DATETIME MINUTE_CEIL(DATETIME datetime, INT period)
DATETIME MINUTE_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding up time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many minutes each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select minute_ceil("2023-07-13 22:28:18", 5);
+--------------------------------------------------------------+
| minute_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+
1 row in set (0.21 sec)
```

### keywords

    MINUTE_CEIL, MINUTE, CEIL

### Best Practice

See also [date_ceil](./date_ceil)
