---
{
    "title": "ARRAY",
    "language": "en"
}
---

## array()

array()

### description

#### Syntax

`ARRAY<T> array(T, ...)`

construct an array with variadic elements and return it, T could be column or literal

### notice

`Only supported in vectorized engine`

### example

```
mysql> select array("1", 2, 1.1);
+----------------------+
| array('1', 2, '1.1') |
+----------------------+
| ['1', '2', '1.1']    |
+----------------------+
1 row in set (0.00 sec)


mysql> select array(null, 1);
+----------------+
| array(NULL, 1) |
+----------------+
| [NULL, 1]      |
+----------------+
1 row in set (0.00 sec)

mysql> select array(1, 2, 3);
+----------------+
| array(1, 2, 3) |
+----------------+
| [1, 2, 3]      |
+----------------+
1 row in set (0.00 sec)

mysql>  select array(qid, creationDate, null) from nested  limit 4;
+------------------------------------+
| array(`qid`, `creationDate`, NULL) |
+------------------------------------+
| [1000038, 20090616074056, NULL]    |
| [1000069, 20090616075005, NULL]    |
| [1000130, 20090616080918, NULL]    |
| [1000145, 20090616081545, NULL]    |
+------------------------------------+
4 rows in set (0.01 sec)
```

### keywords

ARRAY,ARRAY,CONSTRUCTOR

