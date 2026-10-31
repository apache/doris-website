---
{
    "title": "DAYS_DIFF",
    "language": "en"
}
---

## days_diff
### description
#### Syntax

`INT days_diff(DATETIME enddate, DATETIME startdate)`

The number of days between end date and start date, the date judgment is accurate to seconds and rounded down to the nearest integer. Different from the date_diff function, the datediff function judges the date with precision to the day."

### example

```
mysql> select days_diff('2020-12-25 22:00:00','2020-12-24 22:00:00');
+---------------------------------------------------------+
| days_diff('2020-12-25 22:00:00', '2020-12-24 22:00:00') |
+---------------------------------------------------------+
|                                                       1 |
+---------------------------------------------------------+

mysql> select days_diff('2020-12-25 22:00:00','2020-12-24 22:00:01');
+---------------------------------------------------------+
| days_diff('2020-12-24 22:00:01', '2020-12-25 22:00:00') |
+---------------------------------------------------------+
|                                                       0 |
+---------------------------------------------------------+
```

### keywords

    days_diff
