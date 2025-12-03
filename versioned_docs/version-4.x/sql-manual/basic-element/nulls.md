---
{
    "title": "NULL",
    "language": "en"
}
---

## Basic Introduction to NULL

If a column in a row has no value, it is said to be NULL. NULL can appear in any column not restricted by a "NOT NULL" constraint. Use NULL when the actual value is unknown or when a value has no meaning.

Do not use NULL to represent numerical zero or an empty string. They are not equivalent.

Any arithmetic expression that includes NULL will always result in NULL. For example, adding NULL to 10 still results in NULL. In fact, when given NULL as an operand, all operators return NULL.

## NULL as a Function Argument

When a NULL is provided as an argument, most aggregate functions return NULL. You can use the IFNULL function to return a value when a NULL value occurs. For example, the expression IFNULL(arg, 0) returns 0 when arg is NULL and returns its value when arg is not NULL. For the specific behavior of each function, please refer to the "Functions" section.

## NULL and Comparison Operators

To test for NULL results, only the comparison conditions IS NULL and IS NOT NULL can be used. If a condition that depends on NULL is used, the result is UNKNOWN. Since NULL represents missing data, NULL cannot be equal to or not equal any value or another NULL.

In comparable scenarios (such as nested type comparisons, where the inner value is NULL), NULL is always considered to be less than any value that can be represented by the current type. That is, it is less than any value except itself:

```sql
select array(null) < array(-1), array(null) > array(-1);
+-------------------------+-------------------------+
| array(null) < array(-1) | array(null) > array(-1) |
+-------------------------+-------------------------+
|                       1 |                       0 |
+-------------------------+-------------------------+

select array(cast("nan" as double)) > array(null);
+--------------------------------------------+
| array(cast("nan" as double)) > array(null) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+

select array(cast("inf" as double)) > array(null);
+--------------------------------------------+
| array(cast("inf" as double)) > array(null) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```

## NULL in Conditions

Conditions that evaluate to UNKNOWN behave almost the same as FALSE. For example, a SELECT statement with a condition that evaluates to UNKNOWN in the WHERE clause will not return any rows. However, the difference between conditions that evaluate to UNKNOWN and FALSE is that further operations on the evaluation result of an UNKNOWN condition will also be evaluated as UNKNOWN. Therefore, the calculation result of NOT FALSE is TRUE, but the calculation result of NOT UNKNOWN is UNKNOWN.

The table below shows examples of various evaluations involving NULL in conditions. If a condition that evaluates to UNKNOWN is used in the WHERE clause of a SELECT statement, then the query will not return any rows.

| **Condition**   | **Value of A** | **Evaluation** |
| :-------------- | :------------- | :------------- |
| `a IS NULL`     | `10`           | `FALSE`        |
| `a IS NOT NULL` | `10`           | `TRUE`         |
| `a IS NULL`     | `NULL`         | `TRUE`         |
| `a IS NOT NULL` | `NULL`         | `FALSE`        |
| `a = NULL`      | `10`           | `UNKNOWN`      |
| `a != NULL`     | `10`           | `UNKNOWN`      |
| `a = NULL`      | `NULL`         | `UNKNOWN`      |
| `a != NULL`     | `NULL`         | `UNKNOWN`      |
| `a = 10`        | `NULL`         | `UNKNOWN`      |
| `a != 10`       | `NULL`         | `UNKNOWN`      |