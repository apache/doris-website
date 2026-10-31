---
{
    "title": "MINUTES_SUB",
    "language": "en"
}
---

## minutes_sub
### description
#### Syntax

`DATETIME MINUTES_SUB(DATETIME date, INT minutes)`

Subtracts a specified number of minutes from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is DATETIME.

### example

```
mysql> select minutes_sub("2020-02-02 02:02:02", 1);
+---------------------------------------+
| minutes_sub('2020-02-02 02:02:02', 1) |
+---------------------------------------+
| 2020-02-02 02:01:02                   |
+---------------------------------------+
```

### keywords

    MINUTES_SUB
