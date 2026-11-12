---
{
    "title": "YEARS_ADD",
    "language": "en"
}
---

## years_add
### description
#### Syntax

`DATETIME YEARS_ADD(DATETIME date, INT years)`

ADD a specified number of years from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is consistent with that of the parameter date.

### example

```
mysql> select years_add("2020-01-31 02:02:02", 1);
+-------------------------------------+
| years_add('2020-01-31 02:02:02', 1) |
+-------------------------------------+
| 2021-01-31 02:02:02                 |
+-------------------------------------+
```

### keywords

    YEARS_ADD
