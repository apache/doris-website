---
{
    "title": "WEEKS_SUB",
    "language": "en"
}
---

## weeks_sub
### description
#### Syntax

`DATETIME WEEKS_SUB(DATETIME date, INT weeks)`

Subtracts a specified number of weeks from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is consistent with that of the parameter date.

### example

```
mysql> select weeks_sub("2020-02-02 02:02:02", 1);
+-------------------------------------+
| weeks_sub('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2020-01-26 02:02:02                 |
+-------------------------------------+
```

### keywords

    WEEKS_SUB
