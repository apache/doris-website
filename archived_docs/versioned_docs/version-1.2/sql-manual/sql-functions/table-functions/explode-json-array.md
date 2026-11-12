---
{
    "title": "EXPLODE_JSON_ARRAY",
    "language": "en"
}
---

## explode_json_array

### description

Table functions must be used in conjunction with Lateral View.

Expand a json array. According to the array element type, there are three function names. Corresponding to integer, floating point and string arrays respectively.

#### syntax

```sql
explode_json_array_int(json_str)
explode_json_array_double(json_str)
explode_json_array_string(json_str)
```

### example

Original table data:

```
mysql> select k1 from example1 order by k1;
+------+
| k1   |
+------+
|    1 |
|    2 |
|    3 |
+------+
```

Lateral View:

```
mysql> select k1, e1 from example1 lateral view explode_json_array_int('[]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    2 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_int('[1,2,3]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 |    1 |
|    1 |    2 |
|    1 |    3 |
|    2 |    1 |
|    2 |    2 |
|    2 |    3 |
|    3 |    1 |
|    3 |    2 |
|    3 |    3 |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_int('[1,"b",3]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    1 |    1 |
|    1 |    3 |
|    2 | NULL |
|    2 |    1 |
|    2 |    3 |
|    3 | NULL |
|    3 |    1 |
|    3 |    3 |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_int('["a","b","c"]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    1 | NULL |
|    1 | NULL |
|    2 | NULL |
|    2 | NULL |
|    2 | NULL |
|    3 | NULL |
|    3 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_int('{"a": 3}') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    2 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_double('[]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    2 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_double('[1,2,3]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    1 | NULL |
|    1 | NULL |
|    2 | NULL |
|    2 | NULL |
|    2 | NULL |
|    3 | NULL |
|    3 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_double('[1,"b",3]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    1 | NULL |
|    1 | NULL |
|    2 | NULL |
|    2 | NULL |
|    2 | NULL |
|    3 | NULL |
|    3 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_double('[1.0,2.0,3.0]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 |    1 |
|    1 |    2 |
|    1 |    3 |
|    2 |    1 |
|    2 |    2 |
|    2 |    3 |
|    3 |    1 |
|    3 |    2 |
|    3 |    3 |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_double('[1,"b",3]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    1 | NULL |
|    1 | NULL |
|    2 | NULL |
|    2 | NULL |
|    2 | NULL |
|    3 | NULL |
|    3 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_double('["a","b","c"]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    1 | NULL |
|    1 | NULL |
|    2 | NULL |
|    2 | NULL |
|    2 | NULL |
|    3 | NULL |
|    3 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_double('{"a": 3}') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    2 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_string('[]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    2 | NULL |
|    3 | NULL |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_string('[1.0,2.0,3.0]') tmp1 as e1 order by k1, e1;
+------+----------+
| k1   | e1       |
+------+----------+
|    1 | 1.000000 |
|    1 | 2.000000 |
|    1 | 3.000000 |
|    2 | 1.000000 |
|    2 | 2.000000 |
|    2 | 3.000000 |
|    3 | 1.000000 |
|    3 | 2.000000 |
|    3 | 3.000000 |
+------+----------+

mysql> select k1, e1 from example1 lateral view explode_json_array_string('[1,"b",3]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | 1    |
|    1 | 3    |
|    1 | b    |
|    2 | 1    |
|    2 | 3    |
|    2 | b    |
|    3 | 1    |
|    3 | 3    |
|    3 | b    |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_string('["a","b","c"]') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | a    |
|    1 | b    |
|    1 | c    |
|    2 | a    |
|    2 | b    |
|    2 | c    |
|    3 | a    |
|    3 | b    |
|    3 | c    |
+------+------+

mysql> select k1, e1 from example1 lateral view explode_json_array_string('{"a": 3}') tmp1 as e1 order by k1, e1;
+------+------+
| k1   | e1   |
+------+------+
|    1 | NULL |
|    2 | NULL |
|    3 | NULL |
+------+------+
```

### keywords

explode,json,array,json_array,explode_json,explode_json_array
