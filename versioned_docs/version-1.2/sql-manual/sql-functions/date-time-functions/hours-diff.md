---
{
    "title": "HOURS_DIFF",
    "language": "en"
}
---

## hours_diff
### description
#### Syntax

`INT hours_diff(DATETIME enddate, DATETIME startdate)`

The difference between the start time and the end time is a few hours

### example

```
mysql> select hours_diff('2020-12-25 22:00:00','2020-12-25 21:00:00');
+----------------------------------------------------------+
| hours_diff('2020-12-25 22:00:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+
```

### keywords

    hours_diff
