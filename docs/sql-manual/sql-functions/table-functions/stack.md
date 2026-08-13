---
{
    "title": "STACK",
    "language": "en",
    "description": "The stack function separates expressions into rows in row-major order and pads the last row with NULL values."
}
---

## Description

`stack` separates a list of expressions into a fixed number of rows. The expressions are arranged in row-major order, which is compatible with the Spark and Hive `stack` functions. Use `stack` with [`LATERAL VIEW`](../../../query-data/lateral-view.md) to add the generated columns to each input row.

## Syntax

```sql
STACK(<num_rows>, <expr1> [, <expr2> ...])
```

## Parameters

- `<num_rows>`: A positive constant integer that specifies the number of rows to generate. Constant expressions, such as `3 - 1`, are supported.
- `<expr1> [, <expr2> ...]`: Expressions to distribute across the generated rows. Expressions in the same output column must have compatible types. Expressions can reference columns from the input row.

## Return Value

Returns `<num_rows>` rows. The number of output columns is the ceiling of the number of expressions divided by `<num_rows>`. Values are assigned row by row from left to right. If the final row does not contain enough expressions, the missing values are filled with `NULL`.

When `stack` is used with a single expression per output column, the table function returns one column. When multiple output columns are produced, specify aliases in the `LATERAL VIEW` clause to name them.

## Usage Notes

1. `<num_rows>` must be a positive constant integer. A column reference, non-integer value, zero, or negative value is invalid.
2. For each output column, non-`NULL` expressions assigned to that column must have the same type. A column containing only `NULL` expressions has the `NULL` type.
3. Values are laid out in row-major order: the first output row receives the first value of every output column, then the second row receives the second value of every output column.
4. `stack` is a table-generating function and is normally used with `LATERAL VIEW`.

## Examples

### Basic usage

```sql
SELECT c1, c2
FROM (SELECT 1) t
LATERAL VIEW stack(2, 1, 2, 3) s AS c1, c2
ORDER BY c1, c2;
```

```text
+------+------+
| c1   | c2   |
+------+------+
|    1 |    2 |
|    3 | NULL |
+------+------+
```

### Row-major layout

```sql
SELECT c1, c2
FROM (SELECT 1) t
LATERAL VIEW stack(3, 1, 'a', 2, 'b', 3, 'c') s AS c1, c2
ORDER BY c1, c2;
```

```text
+------+------+
| c1   | c2   |
+------+------+
|    1 | a    |
|    2 | b    |
|    3 | c    |
+------+------+
```

When there are fewer expressions than required to fill the last row, the missing values are `NULL`:

```sql
SELECT c1
FROM (SELECT 1) t
LATERAL VIEW stack(4, 1, 2, 3) s AS c1
ORDER BY c1;
```

```text
+------+
| c1   |
+------+
| NULL |
|    1 |
|    2 |
|    3 |
+------+
```

### Column expressions and type checking

```sql
SELECT id, c1, c2
FROM (
    SELECT 1 AS id, 10 AS a, 'x' AS s1, 20 AS b, 'y' AS s2
) AS test_stack
LATERAL VIEW stack(2, a, s1, b, s2) s AS c1, c2
ORDER BY id, c1, c2;
```

Expressions are evaluated for each input row. In this example, `a` and `b` form one output column and `s1` and `s2` form the other. If expressions assigned to one output column have incompatible types, the query returns an analysis error.

`NULL` expressions can be used with values of another type; the `NULL` values are padded or preserved in the result.
