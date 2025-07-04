---
{
    "title": "MONTH_FLOOR",
    "language": "en"
}
---

## month_floor
### description
#### Syntax

```sql
DATETIME MONTH_FLOOR(DATETIME datetime)
DATETIME MONTH_FLOOR(DATETIME datetime, DATETIME origin)
DATETIME MONTH_FLOOR(DATETIME datetime, INT period)
DATETIME MONTH_FLOOR(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding down time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many months each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select month_floor("2023-07-13 22:28:18", 5);
+--------------------------------------------------------------+
| month_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-05-01 00:00:00                                          |
+--------------------------------------------------------------+
1 row in set (0.12 sec)
```

### keywords

    MONTH_FLOOR, MONTH, FLOOR
