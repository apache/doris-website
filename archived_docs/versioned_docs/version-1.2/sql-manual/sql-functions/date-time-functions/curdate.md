---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "en"
}
---

## curdate,current_date
### Description
#### Syntax

`DATE CURDATE()`

Get the current date and return it in Date type

### example

```
mysql> SELECT CURDATE();
+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+

mysql> SELECT CURDATE() + 0;
+---------------+
| CURDATE() + 0 |
+---------------+
|      20191220 |
+---------------+
```
### keywords

    CURDATE,CURRENT_DATE
