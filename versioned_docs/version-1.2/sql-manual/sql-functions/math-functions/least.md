---
{
    "title": "LEAST",
    "language": "en"
}
---

## least

### description
#### Syntax

`least(col_a, col_b, …, col_n)`  

`column` supports the following types: `TINYINT` `SMALLINT` `INT` `BIGINT` `LARGEINT` `FLOAT` `DOUBLE` `STRING` `DATETIME` `DECIMAL`

Compare the size of `n columns` and return the smallest among them. If there is `NULL` in `column`, return `NULL`.

### example

```
mysql> select least(-1, 0, 5, 8);
+--------------------+
| least(-1, 0, 5, 8) |
+--------------------+
|                 -1 |
+--------------------+
mysql> select least(-1, 0, 5, NULL);
+-----------------------+
| least(-1, 0, 5, NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
mysql> select least(6.3, 4.29, 7.6876);
+--------------------------+
| least(6.3, 4.29, 7.6876) |
+--------------------------+
|                     4.29 |
+--------------------------+
mysql> select least("2022-02-26 20:02:11","2020-01-23 20:02:11","2020-06-22 20:02:11");
+----------------------------------------------------------------------------+
| least('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11') |
+----------------------------------------------------------------------------+
| 2020-01-23 20:02:11                                                        |
+----------------------------------------------------------------------------+
```

### keywords
	LEAST
