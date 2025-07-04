---
{
    "title": "HOURS_ADD",
    "language": "en"
}
---

## hours_add
### description
#### Syntax

`DATETIME HOURS_ADD(DATETIME date, INT hours)`

Add specified hours from date time or date

The parameter date can be DATETIME or DATE, and the return type is DATETIME.

### example

```
mysql> select hours_add("2020-02-02 02:02:02", 1);
+-------------------------------------+
| hours_add('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2020-02-02 03:02:02                 |
+-------------------------------------+
```

### keywords

    HOURS_ADD
