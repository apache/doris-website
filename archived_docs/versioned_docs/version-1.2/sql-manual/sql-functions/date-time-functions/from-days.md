---
{
    "title": "FROM_DAYS",
    "language": "en"
}
---

## from_days
### Description
#### Syntax

`DATE FROM_DAYS(INT N)`


Given a day number, returns a DATE. Note that to maintain consistent behavior with MySQL, the date 0000-02-29 does not exist.

### example

```
mysql> select from_days(730669);
+-------------------+
| from_days(730669) |
+-------------------+
| 2000-07-03        |
+-------------------+

mysql> select from_days (5);
+--------------+
| from_days(5) |
+--------------+
| 0000-01-05   |
+--------------+

mysql> select from_days (59);
+---------------+
| from_days(59) |
+---------------+
| 0000-02-28    |
+---------------+

mysql> select from_days (60);
+---------------+
| from_days(60) |
+---------------+
| 0000-03-01    |
+---------------+
```

### keywords
    FROM_DAYS,FROM,DAYS
