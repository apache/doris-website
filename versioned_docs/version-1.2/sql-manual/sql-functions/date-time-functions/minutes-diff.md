---
{
    "title": "MINUTES_DIFF",
    "language": "en"
}
---

## minutes_diff
### description
#### Syntax

`INT minutes_diff(DATETIME enddate, DATETIME startdate)`

The difference between the start time and the end time is a few minutes

### example

```
mysql> select minutes_diff('2020-12-25 22:00:00','2020-12-25 21:00:00');
+------------------------------------------------------------+
| minutes_diff('2020-12-25 22:00:00', '2020-12-25 21:00:00') |
+------------------------------------------------------------+
|                                                         60 |
+------------------------------------------------------------+
```

### keywords

    minutes_diff
