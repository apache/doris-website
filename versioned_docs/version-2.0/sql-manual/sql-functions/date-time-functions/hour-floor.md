---
{
    "title": "HOUR_FLOOR",
    "language": "en"
}
---

## hour_floor
### description
#### Syntax

```sql
DATETIME HOUR_FLOOR(DATETIME datetime)
DATETIME HOUR_FLOOR(DATETIME datetime, DATETIME origin)
DATETIME HOUR_FLOOR(DATETIME datetime, INT period)
DATETIME HOUR_FLOOR(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding down time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many hours each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select hour_floor("2023-07-13 22:28:18", 5);
+-------------------------------------------------------------+
| hour_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+-------------------------------------------------------------+
| 2023-07-13 21:00:00                                         |
+-------------------------------------------------------------+
1 row in set (0.23 sec)
```

### keywords

    HOUR_FLOOR, HOUR, FLOOR

### Best Practice

See also [date_floor](./date_floor)
