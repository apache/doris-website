---
{
    "title": "MONTHS_DIFF",
    "language": "en"
}
---

## months_diff
### description
#### Syntax

`INT months_diff(DATETIME enddate, DATETIME startdate)`

The difference between the start time and the end time is months

### example

```
mysql> select months_diff('2020-12-25','2020-10-25');
+-----------------------------------------------------------+
| months_diff('2020-12-25 00:00:00', '2020-10-25 00:00:00') |
+-----------------------------------------------------------+
|                                                         2 |
+-----------------------------------------------------------+
```

### keywords

    months_diff
