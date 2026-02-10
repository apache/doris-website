---
{
    "title": "EXPLODE",
    "language": "en"
}
---

## explode

### description

Table functions must be used in conjunction with Lateral View.

explode array column to rows. `explode_outer` will return NULL, while `array` is NULL or empty.
`explode` and `explode_outer` both keep the nested NULL elements of array.

#### syntax
```sql
explode(expr)
explode_outer(expr)
```

### example
```
mysql> select e1 from (select 1 k1) as t lateral view explode([1,2,3]) tmp1 as e1;
+------+
| e1   |
+------+
|    1 |
|    2 |
|    3 |
+------+

mysql> select e1 from (select 1 k1) as t lateral view explode_outer(null) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
+------+

mysql> select e1 from (select 1 k1) as t lateral view explode([]) tmp1 as e1;
Empty set (0.010 sec)

mysql> select e1 from (select 1 k1) as t lateral view explode([null,1,null]) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+

mysql> select e1 from (select 1 k1) as t lateral view explode_outer([null,1,null]) tmp1 as e1;
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```

### keywords
EXPLODE,EXPLODE_OUTER,ARRAY