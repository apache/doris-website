---
{
    "title": "YEARS_SUB",
    "language": "en"
}
---

## years_sub
### description
#### Syntax

`DATETIME YEARS_SUB(DATETIME date, INT years)`

Subtracts a specified number of years from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is consistent with that of the parameter date.

### example

```
mysql> select years_sub("2020-02-02 02:02:02", 1);
+-------------------------------------+
| years_sub('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2019-02-02 02:02:02                 |
+-------------------------------------+
```

### keywords

    YEARS_SUB
