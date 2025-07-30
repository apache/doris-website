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

The difference between the start time and the end time is a few days, the date judgment is accurate to seconds and rounded down to an integer. This is different from date_diff function, which only provides accuracy up to days."

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
