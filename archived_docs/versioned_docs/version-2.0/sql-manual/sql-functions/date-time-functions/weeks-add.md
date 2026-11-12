---
{
    "title": "WEEKS_ADD",
    "language": "en"
}
---

## weeks_add
### description
#### Syntax

`DATETIME WEEKS_ADD(DATETIME date, INT weeks)`

ADD a specified number of weeks from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is consistent with that of the parameter date.

### example

```
mysql> select weeks_add("2020-02-02 02:02:02", 1);
+-------------------------------------+
| weeks_add('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2020-02-09 02:02:02                 |
+-------------------------------------+
```

### keywords

    WEEKS_ADD
