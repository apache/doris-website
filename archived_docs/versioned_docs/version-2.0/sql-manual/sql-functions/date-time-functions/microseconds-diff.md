---
{
    "title": "MICROSECONDS_DIFF",
    "language": "en"
}
---

## microseconds_diff
### description
#### Syntax

`INT microseconds_diff(DATETIME enddate, DATETIME startdate)`

How many microseconds is the difference between the start time and the end time.

### example

```
mysql> select microseconds_diff('2020-12-25 21:00:00.623000','2020-12-25 21:00:00.123000');
+-----------------------------------------------------------------------------------------------------------------------------+
| microseconds_diff(cast('2020-12-25 21:00:00.623000' as DATETIMEV2(6)), cast('2020-12-25 21:00:00.123000' as DATETIMEV2(6))) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                      500000 |
+-----------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.12 sec)
```

### keywords

    microseconds_diff
