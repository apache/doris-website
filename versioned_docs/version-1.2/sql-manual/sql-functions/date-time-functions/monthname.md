---
{
    "title": "MONTHNAME",
    "language": "en"
}
---

## monthname
### Description
#### Syntax

`VARCHAR MONTHNAME (DATE)`


Month name corresponding to return date

The parameter is Date or Datetime type

### example

```
mysql> select monthname('2008-02-03 00:00:00');
+----------------------------------+
| monthname('2008-02-03 00:00:00') |
+----------------------------------+
| February                         |
+----------------------------------+
```
### keywords
    MONTHNAME
