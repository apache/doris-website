---
{
    "title": "TIMESTAMPADD",
    "language": "en"
}
---

## timestampadd
### description
#### Syntax

`DATETIME TIMESTAMPADD(unit, interval, DATETIME datetime_expr)`

Adds the integer expression interval to the date or datetime expression datetime_expr. 

The unit for interval is given by the unit argument, which should be one of the following values: 

SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, or YEAR.

### example

```

mysql> SELECT TIMESTAMPADD(MINUTE,1,'2019-01-02');
+------------------------------------------------+
| timestampadd(MINUTE, 1, '2019-01-02 00:00:00') |
+------------------------------------------------+
| 2019-01-02 00:01:00                            |
+------------------------------------------------+

mysql> SELECT TIMESTAMPADD(WEEK,1,'2019-01-02');
+----------------------------------------------+
| timestampadd(WEEK, 1, '2019-01-02 00:00:00') |
+----------------------------------------------+
| 2019-01-09 00:00:00                          |
+----------------------------------------------+
```
### keywords
    TIMESTAMPADD
