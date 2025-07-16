---
{
    "title": "MAKEDATE",
    "language": "en"
}
---

## makedate
### Description
#### Syntax

`DATE MAKEDATE(INT year, INT dayofyear)`

Returns a date, given year and day-of-year values. dayofyear must be greater than 0 or the result is NULL.

### example
```
mysql> select makedate(2021,1), makedate(2021,100), makedate(2021,400);
+-------------------+---------------------+---------------------+
| makedate(2021, 1) | makedate(2021, 100) | makedate(2021, 400) |
+-------------------+---------------------+---------------------+
| 2021-01-01        | 2021-04-10          | 2022-02-04          |
+-------------------+---------------------+---------------------+
```
### keywords
    MAKEDATE
