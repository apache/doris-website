---
{
    "title": "MONTHS_ADD",
    "language": "en"
}
---

## months_add
### description
#### Syntax

`DATETIME MONTHS_ADD(DATETIME date, INT months)`

Add the specified month from the date

The parameter date can be DATETIME or DATE, and the return type is consistent with that of the parameter date.

### example

```
mysql> select months_add("2020-01-31 02:02:02", 1);
+--------------------------------------+
| months_add('2020-01-31 02:02:02', 1) |
+--------------------------------------+
| 2020-02-29 02:02:02                  |
+--------------------------------------+
```

### keywords

    MONTHS_ADD
