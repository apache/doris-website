---
{
    "title": "SECONDS_DIFF",
    "language": "en"
}
---

## seconds_diff
### description
#### Syntax

`INT seconds_diff(DATETIME enddate, DATETIME startdate)`

The difference between the start time and the end time is seconds

### example

```
mysql> select seconds_diff('2020-12-25 22:00:00','2020-12-25 21:00:00');
+------------------------------------------------------------+
| seconds_diff('2020-12-25 22:00:00', '2020-12-25 21:00:00') |
+------------------------------------------------------------+
|                                                       3600 |
+------------------------------------------------------------+
```

### keywords

    seconds_diff
