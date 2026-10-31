---
{
    "title": "MINUTE_FLOOR",
    "language": "en"
}
---

## minute_floor
### description
#### Syntax

```sql
DATETIME MINUTE_FLOOR(DATETIME datetime)
DATETIME MINUTE_FLOOR(DATETIME datetime, DATETIME origin)
DATETIME MINUTE_FLOOR(DATETIME datetime, INT period)
DATETIME MINUTE_FLOOR(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding down time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many minutes each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select minute_floor("2023-07-13 22:28:18", 5);
+---------------------------------------------------------------+
| minute_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+---------------------------------------------------------------+
| 2023-07-13 22:25:00                                           |
+---------------------------------------------------------------+
1 row in set (0.06 sec)
```

### keywords

    MINUTE_FLOOR, MINUTE, FLOOR
