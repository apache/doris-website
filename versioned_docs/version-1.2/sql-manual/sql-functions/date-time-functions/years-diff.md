---
{
    "title": "YEARS_DIFF",
    "language": "en"
}
---

## years_diff
### description
#### Syntax

`INT years_diff(DATETIME enddate, DATETIME startdate)`

The difference between the start time and the end time is several years

### example

```
mysql> select years_diff('2020-12-25','2019-10-25');
+----------------------------------------------------------+
| years_diff('2020-12-25 00:00:00', '2019-10-25 00:00:00') |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+
```

### keywords

    years_diff
