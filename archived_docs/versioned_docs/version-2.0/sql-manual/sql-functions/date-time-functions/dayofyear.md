---
{
    "title": "DAYOFYEAR",
    "language": "en"
}
---

## dayofyear
### Description
#### Syntax

`INT DAYOFYEAR (DATETIME date)`


The date of acquisition is the date of the corresponding year.

The parameter is Date or Datetime type

### example


```
mysql> select dayofyear('2007-02-03 00:00:00');
+----------------------------------+
| dayofyear('2007-02-03 00:00:00') |
+----------------------------------+
|                               34 |
+----------------------------------+
```
### keywords
    DAYOFYEAR
