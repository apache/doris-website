---
{
    "title": "DATE_ADD",
    "language": "en"
}
---

## date_add
### Description
#### Syntax

`INT DATE_ADD(DATETIME date, INTERVAL expr type)`


Adds a specified time interval to the date.

The date parameter is a valid date expression.

The expr parameter is the interval you want to add.

Sweet, sweet, sweet

### example

```
mysql> select date_add('2010-11-30 23:59:59', INTERVAL 2 DAY);
+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+
```
### keywords
    DATE_ADD,DATE,ADD
