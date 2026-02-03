---
{
    "title": "Conditional Functions Overview",
    "language": "en",
    "description": "Conditional functions are built-in functions used to perform conditional logic and branching in SQL queries."
}
---

# Conditional Functions Overview

Conditional functions are built-in functions used to perform conditional logic and branching in SQL queries. They help execute different operations based on specified conditions, such as selecting values, handling NULL values, and performing case-based logic.

## Vectorized Execution and Conditional Functions

Doris is a vectorized execution engine. However, conditional functions may behave in ways that seem counterintuitive.

Consider the following example:

```sql
mysql> set enable_strict_cast = true;
Query OK, 0 rows affected (0.00 sec)

mysql> select count(
    ->     if(number < 128 , 
    ->       cast(number as tinyint), 
    ->       cast(number as String))
    ->   ) from numbers("number" = "300");
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Value 128 out of range for type tinyint
```

In this example, even though we only cast to `tinyint` when `number < 128` in the `if` function, an error still occurs. This is because of how conditional functions like `if(cond, colA, colB)` were traditionally executed:

1. First, both `colA` and `colB` are fully computed
2. Then, based on the value of `cond`, the corresponding result is selected and returned

So even if `colA`'s value is not actually used in practice, since `colA` is fully computed, it will still trigger an error.

Functions like `if`, `ifnull`, `case`, and `coalesce` have similar behavior.

Note that functions like `LEAST` do not have this issue because they inherently need to compute all parameters to compare values.

## Short-Circuit Evaluation

In Doris 4.0.3, we improved the execution logic of conditional functions to allow short-circuit evaluation.

```sql
mysql> set short_circuit_evaluation = true;
Query OK, 0 rows affected (0.00 sec)

mysql> select count(
    ->     if(number < 128 , 
    ->       cast(number as tinyint), 
    ->       cast(number as String))
    ->   ) from numbers("number" = "300");
+-------------------------------------------------------------------------+
| count(if(number < 128, cast(number as tinyint), cast(number as String)))|
+-------------------------------------------------------------------------+
|                                                                      300 |
+-------------------------------------------------------------------------+
```

With short-circuit evaluation enabled, functions like `if`, `ifnull`, `case`, and `coalesce` can avoid unnecessary computations in many scenarios, thus preventing errors and improving performance.

### Enabling Short-Circuit Evaluation

To enable short-circuit evaluation, set the session variable:

```sql
SET short_circuit_evaluation = true;
```

### Benefits of Short-Circuit Evaluation

1. **Error Prevention**: Avoids executing branches that would cause errors when conditions exclude them
2. **Performance Improvement**: Reduces unnecessary computations by only evaluating branches that are actually needed
3. **More Intuitive Behavior**: Makes conditional functions behave more like traditional programming language conditionals

## Common Conditional Functions

Common conditional functions that benefit from short-circuit evaluation include:

- `IF`: Returns one of two values based on a condition
- `IFNULL`: Returns the first argument if it's not NULL, otherwise returns the second argument
- `CASE`: Provides multiple conditional branches similar to switch-case statements
- `COALESCE`: Returns the first non-NULL value from a list of arguments
- `NULLIF`: Returns NULL if two arguments are equal, otherwise returns the first argument

For detailed information about each function, please refer to their respective documentation pages.
