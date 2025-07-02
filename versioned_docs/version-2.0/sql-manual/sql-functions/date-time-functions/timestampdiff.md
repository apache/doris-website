---
{
    "title": "TIMESTAMPDIFF",
    "language": "en"
}
---

## timestampdiff
### description
#### Syntax

`INT TIMESTAMPDIFF(unit, DATETIME datetime_expr1, DATETIME datetime_expr2)`

Returns datetime_expr2 − datetime_expr1, where datetime_expr1 and datetime_expr2 are date or datetime expressions. 

The unit for the result (an integer) is given by the unit argument.
 
The legal values for unit are the same as those listed in the description of the TIMESTAMPADD() function.

### example

```

MySQL> SELECT TIMESTAMPDIFF(MONTH,'2003-02-01','2003-05-01');
+--------------------------------------------------------------------+
| timestampdiff(MONTH, '2003-02-01 00:00:00', '2003-05-01 00:00:00') |
+--------------------------------------------------------------------+
|                                                                  3 |
+--------------------------------------------------------------------+

MySQL> SELECT TIMESTAMPDIFF(YEAR,'2002-05-01','2001-01-01');
+-------------------------------------------------------------------+
| timestampdiff(YEAR, '2002-05-01 00:00:00', '2001-01-01 00:00:00') |
+-------------------------------------------------------------------+
|                                                                -1 |
+-------------------------------------------------------------------+


MySQL> SELECT TIMESTAMPDIFF(MINUTE,'2003-02-01','2003-05-01 12:05:55');
+---------------------------------------------------------------------+
| timestampdiff(MINUTE, '2003-02-01 00:00:00', '2003-05-01 12:05:55') |
+---------------------------------------------------------------------+
|                                                              128885 |
+---------------------------------------------------------------------+

```
### keywords
    TIMESTAMPDIFF
