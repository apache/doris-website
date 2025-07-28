---
{
    "title": "SECOND_CEIL",
    "language": "en"
}
---

## second_ceil
### description
#### Syntax

```sql
DATETIME SECOND_CEIL(DATETIME datetime)
DATETIME SECOND_CEIL(DATETIME datetime, DATETIME origin)
DATETIME SECOND_CEIL(DATETIME datetime, INT period)
DATETIME SECOND_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding up time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many seconds each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select second_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5);
+--------------------------------------------------------------+
| second_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-07-13 22:28:20                                          |
+--------------------------------------------------------------+
1 row in set (0.01 sec)
```

### keywords

    SECOND_CEIL, SECOND, CEIL
