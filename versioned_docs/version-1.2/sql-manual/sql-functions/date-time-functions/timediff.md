---
{
    "title": "TIMEDIFF",
    "language": "en"
}
---

## timediff
### Description
#### Syntax

`TIME TIMEDIFF (DATETIME expr1, DATETIME expr2)`


TIMEDIFF returns the difference between two DATETIMEs

The TIMEDIFF function returns the result of expr1 - expr2 expressed as a time value, with a return value of TIME type

The results are limited to TIME values ranging from - 838:59:59 to 838:59:59.

#### example

```
mysql> SELECT TIMEDIFF(now(),utc_timestamp());
+----------------------------------+
| timediff(now(), utc_timestamp()) |
+----------------------------------+
| 08:00:00                         |
+----------------------------------+

mysql> SELECT TIMEDIFF('2019-07-11 16:59:30','2019-07-11 16:59:21');
+--------------------------------------------------------+
| timediff('2019-07-11 16:59:30', '2019-07-11 16:59:21') |
+--------------------------------------------------------+
| 00:00:09                                               |
+--------------------------------------------------------+

mysql> SELECT TIMEDIFF('2019-01-01 00:00:00', NULL);
+---------------------------------------+
| timediff('2019-01-01 00:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+
```
### keywords
    TIMEDIFF
