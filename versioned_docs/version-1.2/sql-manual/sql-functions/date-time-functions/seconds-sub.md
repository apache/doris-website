---
{
    "title": "SECONDS_SUB",
    "language": "en"
}
---

## seconds_sub
### description
#### Syntax

`DATETIME SECONDS_SUB(DATETIME date, INT seconds)`

Subtracts a specified number of seconds from a datetime or date

The parameter date can be DATETIME or DATE, and the return type is DATETIME.

### example

```
mysql> select seconds_sub("2020-01-01 00:00:00", 1);
+---------------------------------------+
| seconds_sub('2020-01-01 00:00:00', 1) |
+---------------------------------------+
| 2019-12-31 23:59:59                   |
+---------------------------------------+
```

### keywords

    SECONDS_SUB
