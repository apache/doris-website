---
{
    "title": "DAYS_SUB",
    "language": "en"
}
---

## days_sub
### description
#### Syntax

`DATETIME DAYS_SUB(DATETIME date, INT days)`

Subtract a specified number of days from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is consistent with that of the parameter date.

### example

```
mysql> select days_sub("2020-02-02 02:02:02", 1);
+------------------------------------+
| days_sub('2020-02-02 02:02:02', 1) |
+------------------------------------+
| 2020-02-01 02:02:02                |
+------------------------------------+
```

### keywords

    DAYS_SUB
