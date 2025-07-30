---
{
    "title": "DAYS_ADD",
    "language": "en"
}
---

## days_add
### description
#### Syntax

`DATETIME DAYS_ADD(DATETIME date, INT days)`

From date time or date plus specified days

The parameter date can be DATETIME or DATE, and the return type is consistent with that of the parameter date.

### example

```
mysql> select days_add(to_date("2020-02-02 02:02:02"), 1);
+---------------------------------------------+
| days_add(to_date('2020-02-02 02:02:02'), 1) |
+---------------------------------------------+
| 2020-02-03                                  |
+---------------------------------------------+
```

### keywords

    DAYS_ADD
