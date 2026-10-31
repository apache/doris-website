---
{
    "title": "SECONDS_ADD",
    "language": "en"
}
---

## seconds_add
### description
#### Syntax

`DATETIME SECONDS_ADD(DATETIME date, INT seconds)`

ADD a specified number of seconds from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is DATETIME.

### example

```
mysql> select seconds_add("2020-02-02 02:02:02", 1);
+---------------------------------------+
| seconds_add('2020-02-02 02:02:02', 1) |
+---------------------------------------+
| 2020-02-02 02:02:03                   |
+---------------------------------------+
```

### keywords

    SECONDS_ADD
