---
{
    "title": "MILLISECONDS_DIFF",
    "language": "en"
}
---

## milliseconds_diff
### description
#### Syntax

`INT milliseconds_diff(DATETIME enddate, DATETIME startdate)`

How many milliseconds is the difference between the start time and the end time?

### example

```
mysql> select milliseconds_diff('2020-12-25 21:00:00.623000','2020-12-25 21:00:00.123000');
+-----------------------------------------------------------------------------------------------------------------------------+
| milliseconds_diff(cast('2020-12-25 21:00:00.623000' as DATETIMEV2(6)), cast('2020-12-25 21:00:00.123000' as DATETIMEV2(6))) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                         500 |
+-----------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.03 sec)
```

### keywords

    milliseconds_diff
