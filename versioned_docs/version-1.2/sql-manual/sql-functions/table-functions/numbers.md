---
{
    "title": "NUMBERS",
    "language": "en"
}
---

## `numbers`

### description

Table-Value-Function, generate a temporary table with only one column named 'number', row values are [0,n).

This function is used in FROM clauses.

#### syntax

```sql
numbers(
  "number" = "n",
  "backend_num" = "m"
  );
```

parameter：
- `number`: It means to generate rows [0, n).
- `backend_num`: Optional parameters. It means this function is executed simultaneously on `m` be nodes (multiple BEs need to be deployed).

### example
```
mysql> select * from numbers("number" = "10");
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
|      5 |
|      6 |
|      7 |
|      8 |
|      9 |
+--------+
```

### keywords

    numbers