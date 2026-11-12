---
{
    "title": "OUTER COMBINATOR",
    "language": "en"
}
---

## outer combinator

### description

#### syntax
`explode_numbers(INT x)`

Adding the `_outer` suffix after the function name of the table function changes the function behavior from `non-outer` to `outer`, and adds a row of `Null` data when the table function generates 0 rows of data.

### example

```
mysql> select e1 from (select 1 k1) as t lateral view explode_numbers(0) tmp1 as e1;
Empty set

mysql> select e1 from (select 1 k1) as t lateral view explode_numbers_outer(0) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
+------+
```
### keywords

    outer