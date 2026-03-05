---
{
    "title": "NUMBERS",
    "language": "en"
}
---

## `numbers`

### description

Table function that generates a temporary table containing only one column with the column name `number` and all element values are `const_value` if `const_value` is specified, otherwise they are [0,`number`) incremented.

#### syntax
```sql
numbers(
  "number" = "n"
  <, "const_value" = "x">
  );
```

parameter：
- `number`: Line number.
- `const_value`: the constant value.

### example
```
mysql> select * from numbers("number" = "5");
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
+--------+
5 rows in set (0.11 sec)

mysql> select * from numbers("number" = "5", "const_value" = "-123");
+--------+
| number |
+--------+
|   -123 |
|   -123 |
|   -123 |
|   -123 |
|   -123 |
+--------+
5 rows in set (0.12 sec)
```

### keywords

    numbers, const_value