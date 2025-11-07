---
{
    "title": "WEEKS_DIFF",
    "language": "en"
}
---

## weeks_diff
### description
#### Syntax

`INT weeks_diff(DATETIME enddate, DATETIME startdate)`

The difference between the start time and the end time is weeks

### example

```
mysql> select weeks_diff('2020-12-25','2020-10-25');
+----------------------------------------------------------+
| weeks_diff('2020-12-25 00:00:00', '2020-10-25 00:00:00') |
+----------------------------------------------------------+
|                                                        8 |
+----------------------------------------------------------+
```

### keywords

    weeks_diff
