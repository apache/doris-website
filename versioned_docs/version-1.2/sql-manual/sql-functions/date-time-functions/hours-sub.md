---
{
    "title": "HOURS_SUB",
    "language": "en"
}
---

## hours_sub
### description
#### Syntax

`DATETIME HOURS_SUB(DATETIME date, INT hours)`

Subtracts a specified number of hours from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is DATETIME.

### example

```
mysql> select hours_sub("2020-02-02 02:02:02", 1);
+-------------------------------------+
| hours_sub('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2020-02-02 01:02:02                 |
+-------------------------------------+
```

### keywords

    HOURS_SUB
