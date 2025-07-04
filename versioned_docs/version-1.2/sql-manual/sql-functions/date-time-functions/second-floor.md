---
{
    "title": "SECOND_FLOOR",
    "language": "en"
}
---

## second_floor
### description
#### Syntax

```sql
DATETIME SECOND_FLOOR(DATETIME datetime)
DATETIME SECOND_FLOOR(DATETIME datetime, DATETIME origin)
DATETIME SECOND_FLOOR(DATETIME datetime, INT period)
DATETIME SECOND_FLOOR(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding down time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many seconds each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select second_floor("2023-07-13 22:28:18", 5);
+---------------------------------------------------------------+
| second_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+---------------------------------------------------------------+
| 2023-07-13 22:28:15                                           |
+---------------------------------------------------------------+
1 row in set (0.10 sec)
```

### keywords

    SECOND_FLOOR, SECOND, FLOOR
