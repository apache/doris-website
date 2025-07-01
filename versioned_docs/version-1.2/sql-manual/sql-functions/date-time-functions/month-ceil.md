---
{
    "title": "MONTH_CEIL",
    "language": "en"
}
---

## month_ceil
### description
#### Syntax

```sql
DATETIME MONTH_CEIL(DATETIME datetime)
DATETIME MONTH_CEIL(DATETIME datetime, DATETIME origin)
DATETIME MONTH_CEIL(DATETIME datetime, INT period)
DATETIME MONTH_CEIL(DATETIME datetime, INT period, DATETIME origin)
```

Convert the date to the nearest rounding up time of the specified time interval period.

- datetime: a valid date expression.
- period: specifies how many months each cycle consists of.
- origin: starting from 0001-01-01T00:00:00.

### example

```
mysql> select month_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5);
+-------------------------------------------------------------+
| month_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+-------------------------------------------------------------+
| 2023-10-01 00:00:00                                         |
+-------------------------------------------------------------+
1 row in set (0.02 sec)
```

### keywords

    MONTH_CEIL, MONTH, CEIL
