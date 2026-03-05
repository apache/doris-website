---
{
    "title": "DAY_CEIL",
    "language": "en"
}
---

## day_ceil
### Description
**Syntax**

```sql
DATETIME DAY_CEIL(DATETIME datetime)
DATETIME DAY_CEIL(DATETIME datetime, DATETIME origin)
DATETIME DAY_CEIL(DATETIME datetime, INT period)
DATETIME DAY_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding up time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many days each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### Example

```
mysql> select day_ceil("2023-07-13 22:28:18", 5);
+-----------------------------------------------------------+
| day_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+-----------------------------------------------------------+
| 2023-07-17 00:00:00                                       |
+-----------------------------------------------------------+
1 row in set (0.01 sec)
```

### Keywords

    DAY_CEIL, DAY, CEIL

### Best Practices

See also [date_ceil](./date_ceil)
