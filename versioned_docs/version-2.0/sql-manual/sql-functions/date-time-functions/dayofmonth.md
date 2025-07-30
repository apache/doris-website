---
{
    "title": "DAYOFMONTH",
    "language": "en"
}
---

## dayofmonth
### Description
#### Syntax

`INT DAYOFMONTH (DATETIME date)`


Get the day information in the date, and return values range from 1 to 31.

The parameter is Date or Datetime type

### example

```
mysql> select dayofmonth('1987-01-31');
+-----------------------------------+
| dayofmonth('1987-01-31 00:00:00') |
+-----------------------------------+
|                                31 |
+-----------------------------------+
```
### keywords
    DAYOFMONTH
