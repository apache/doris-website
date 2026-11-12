---
{
    "title": "MOD",
    "language": "en"
}
---

## mod

### description
#### Syntax

`mod(col_a, col_b)`  

`column` support type：`TINYINT` `SMALLINT` `INT` `BIGINT` `LARGEINT` `FLOAT` `DOUBLE` `DECIMAL`

Find the remainder of a/b. For floating-point types, use the fmod function.

### example

```
mysql> select mod(10, 3);
+------------+
| mod(10, 3) |
+------------+
|          1 |
+------------+

mysql> select fmod(10.1, 3.2);
+-----------------+
| fmod(10.1, 3.2) |
+-----------------+
|      0.50000024 |
+-----------------+
```

### keywords
	MOD，FMOD
