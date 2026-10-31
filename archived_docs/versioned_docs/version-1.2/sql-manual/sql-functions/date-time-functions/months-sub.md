---
{
    "title": "MONTHS_SUB",
    "language": "en"
}
---

## months_sub
### description
#### Syntax

`DATETIME MONTHS_SUB(DATETIME date, INT months)`

Subtracts a specified number of months from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is consistent with that of the parameter date.

### example

```
mysql> select months_sub("2020-02-02 02:02:02", 1);
+--------------------------------------+
| months_sub('2020-02-02 02:02:02', 1) |
+--------------------------------------+
| 2020-01-02 02:02:02                  |
+--------------------------------------+
```

### keywords

    MONTHS_SUB
