---
{
    "title": "MINUTES_ADD",
    "language": "en"
}
---

## minutes_add
### description
#### Syntax

`DATETIME MINUTES_ADD(DATETIME date, INT minutes)`

Add specified minutes from date time or date

The parameter date can be DATETIME or DATE, and the return type is DATETIME.

### example

```
mysql> select minutes_add("2020-02-02", 1);
+---------------------------------------+
| minutes_add('2020-02-02 00:00:00', 1) |
+---------------------------------------+
| 2020-02-02 00:01:00                   |
+---------------------------------------+
```

### keywords

    MINUTES_ADD
