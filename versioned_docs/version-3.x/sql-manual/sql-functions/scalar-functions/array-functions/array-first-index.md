---
{
    "title": "ARRAY_FIRST_INDEX",
    "language": "en",
    "description": "Use an lambda expression as an input parameter to perform corresponding expression calculations on the internal data of other input ARRAY parameters."
}
---

## Description

Use an lambda expression as an input parameter to perform corresponding expression calculations on the internal data of other input ARRAY parameters. Returns the first index such that the return value of `lambda(array1[i], ...)` is not 0. Return 0 if such index is not found.

There are one or more parameters input in the lambda expression, and the number of elements of all input arrays must be the same. Legal scalar functions can be executed in lambda, aggregate functions, etc. are not supported.

## Syntax

```sql
ARRAY_FIRST_INDEX(<lambda>, <arr> [, ...])
```

## Parameters

| Parameter | Description | 
| --- | --- |
| `<lambda>` | A lambda expression where the input parameters must match the number of columns in the given array. The expression can execute valid scalar functions but does not support aggregate functions. |
| `<arr>` | ARRAY array |

## Return Value

Returns the index of the first non-zero value. If no such index is found, returns 0.

## Example

```sql
select array_first_index(x->x+1>3, [2, 3, 4]);
```

```text
+-------------------------------------------------------------------+
| array_first_index(array_map([x] -> x(0) + 1 > 3, ARRAY(2, 3, 4))) |
+-------------------------------------------------------------------+
|                                                                 2 |
+-------------------------------------------------------------------+
```

```sql
select array_first_index(x -> x is null, [null, 1, 2]);
```

```text
+----------------------------------------------------------------------+
| array_first_index(array_map([x] -> x(0) IS NULL, ARRAY(NULL, 1, 2))) |
+----------------------------------------------------------------------+
|                                                                    1 |
+----------------------------------------------------------------------+
```

```sql
select array_first_index(x->power(x,2)>10, [1, 2, 3, 4]);
```

```text
+---------------------------------------------------------------------------------+
| array_first_index(array_map([x] -> power(x(0), 2.0) > 10.0, ARRAY(1, 2, 3, 4))) |
+---------------------------------------------------------------------------------+
|                                                                               4 |
+---------------------------------------------------------------------------------+
```

```sql
select col2, col3, array_first_index((x,y)->x>y, col2, col3) from array_test;
```

```text
+--------------+--------------+---------------------------------------------------------------------+
| col2         | col3         | array_first_index(array_map([x, y] -> x(0) > y(1), `col2`, `col3`)) |
+--------------+--------------+---------------------------------------------------------------------+
| [1, 2, 3]    | [3, 4, 5]    |                                                                   0 |
| [1, NULL, 2] | [NULL, 3, 1] |                                                                   3 |
| [1, 2, 3]    | [9, 8, 7]    |                                                                   0 |
| NULL         | NULL         |                                                                   0 |
+--------------+--------------+---------------------------------------------------------------------+
```