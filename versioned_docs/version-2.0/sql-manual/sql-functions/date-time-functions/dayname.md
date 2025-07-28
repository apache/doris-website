---
{
    "title": "DAYNAME",
    "language": "en"
}
---

## dayname
### Description
#### Syntax

`VARCHAR DAYNAME (DATE)`


Date name corresponding to return date

The parameter is Date or Datetime type

### example

```
mysql> select dayname('2007-02-03 00:00:00');
+--------------------------------+
| dayname('2007-02-03 00:00:00') |
+--------------------------------+
| Saturday                       |
+--------------------------------+
```
### keywords
    DAYNAME
