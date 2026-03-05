---
{
    "title": "DAY_FLOOR",
    "language": "en"
}
---

## day_floor
### Description
**Syntax**

```sql
DATETIME DAY_FLOOR(DATETIME datetime)
DATETIME DAY_FLOOR(DATETIME datetime, DATETIME origin)
DATETIME DAY_FLOOR(DATETIME datetime, INT period)
DATETIME DAY_FLOOR(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding down time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many days each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### Example

```
mysql> select day_floor("2023-07-13 22:28:18", 5);
+------------------------------------------------------------+
| day_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2023-07-12 00:00:00                                        |
+------------------------------------------------------------+
1 row in set (0.07 sec)
```

### Keywords

    DAY_FLOOR,DAY,FLOOR

### Best Practices

See also [date_floor](./date_floor)
