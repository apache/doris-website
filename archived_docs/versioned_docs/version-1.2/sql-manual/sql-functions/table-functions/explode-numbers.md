---
{
    "title": "EXPLODE_NUMBERS",
    "language": "en"
}
---

## explode_numbers

### description

Table functions must be used in conjunction with Lateral View.

Get a number sequence [0,n).

#### syntax

`explode_numbers(n)`

### example
```
mysql> select e1 from (select 1 k1) as t lateral view explode_numbers(5) tmp1 as e1;
+------+
| e1   |
+------+
|    0 |
|    1 |
|    2 |
|    3 |
|    4 |
+------+
```
### keywords

explode,numbers,explode_numbers