---
{
    "title": "IN",
    "language": "en"
}
---

## IN

IN

### description

#### Syntax

`expr IN (value, ...)`

`expr IN (subquery)`

If expr is equal to any value in the IN list, return true; otherwise, return false.

Subquery can only return one column, and the column types returned by subquery must be compatible with expr types.

If subquery returns a bitmap data type column, expr must be an integer.

#### notice

- Currently, bitmap columns are only returned to in subqueries supported in the vectorized engine.

### example

```
mysql> select id from cost where id in (1, 2);
+------+
| id   |
+------+
|    2 |
|    1 |
+------+
```
```
mysql> select id from tbl1 where id in (select id from tbl2);
+------+
| id   |
+------+
|    1 |
|    4 |
|    5 |
+------+
```
```
mysql> select id from tbl1 where id in (select bitmap_col from tbl3);
+------+
| id   |
+------+
|    1 |
|    3 |
+------+
```

### keywords

    IN
