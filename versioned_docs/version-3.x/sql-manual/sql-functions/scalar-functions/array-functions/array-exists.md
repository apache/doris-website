---
{
    "title": "ARRAY_EXISTS",
    "language": "en",
    "description": "Use an optional lambda expression as an input parameter to perform corresponding expression calculations on the internal data of other input ARRAY "
}
---

## Description
Use an optional lambda expression as an input parameter to perform corresponding expression calculations on the internal data of other input ARRAY parameters. Returns 1 when the calculation returns something other than 0; otherwise returns 0.
There are one or more parameters input in the lambda expression, which must be consistent with the number of input array columns later. Legal scalar functions can be executed in lambda, aggregate functions, etc. are not supported.

When lambda expression is not used as a parameter, array1 is used as the calculation result.


## Syntax
```sql
ARRAY_EXISTS([ <lambda>, ] <arr1> [, <arr2> , ...] )
```
## Parameters
| Parameter | Description |  
|---|---|
| `<lambda>` | A lambda expression that can execute valid scalar functions but does not support aggregate functions. |  
| `<arr1>` | Needed be computed array arr1 |  
| `<arr2>` | Needed be computed array arr2 |  

## Return Value
Returns the array computed using the expression. Special cases:
- If the array contains `NULL` values or is itself `NULL`, the result is `NULL`.

## Example

```sql
CREATE TABLE array_test2 (
    id INT,
    c_array1 ARRAY<INT>,
    c_array2 ARRAY<INT>
)
duplicate key (id)
distributed by hash(id) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test2 VALUES
(1, [1, 2, 3, 4, 5], [10, 20, -40, 80, -100]),
(2, [6, 7, 8], [10, 12, 13]),
(3, [1], [-100]),
(4, NULL, NULL);
select *, array_exists(x->x>1,[1,2,3]) from array_test2 order by id;
```
```text
+------+-----------------+-------------------------+-----------------------------------------------+
| id   | c_array1        | c_array2                | array_exists([x] -> x(0) > 1, ARRAY(1, 2, 3)) |
+------+-----------------+-------------------------+-----------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [0, 1, 1]                                     |
|    2 | [6, 7, 8]       | [10, 12, 13]            | [0, 1, 1]                                     |
|    3 | [1]             | [-100]                  | [0, 1, 1]                                     |
|    4 | NULL            | NULL                    | [0, 1, 1]                                     |
+------+-----------------+-------------------------+-----------------------------------------------+
```
```sql
select c_array1, c_array2, array_exists(x->x%2=0,[1,2,3]) from array_test2 order by id;
```

```text
+-----------------+-------------------------+---------------------------------------------------+
| c_array1        | c_array2                | array_exists([x] -> x(0) % 2 = 0, ARRAY(1, 2, 3)) |
+-----------------+-------------------------+---------------------------------------------------+
| [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [0, 1, 0]                                         |
| [6, 7, 8]       | [10, 12, 13]            | [0, 1, 0]                                         |
| [1]             | [-100]                  | [0, 1, 0]                                         |
| NULL            | NULL                    | [0, 1, 0]                                         |
+-----------------+-------------------------+---------------------------------------------------+
```
```sql
select c_array1, c_array2, array_exists(x->abs(x)-1,[1,2,3]) from array_test2 order by id;
```
```text
+-----------------+-------------------------+-------------------------------------------------------------------------------+
| c_array1        | c_array2                | array_exists(cast(array_map(x -> (abs(x) - 1), [1, 2, 3]) as ARRAY<BOOLEAN>)) |
+-----------------+-------------------------+-------------------------------------------------------------------------------+
| [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [0, 1, 1]                                                                     |
| [6, 7, 8]       | [10, 12, 13]            | [0, 1, 1]                                                                     |
| [1]             | [-100]                  | [0, 1, 1]                                                                     |
| NULL            | NULL                    | [0, 1, 1]                                                                     |
+-----------------+-------------------------+-------------------------------------------------------------------------------+
```
```sql
select c_array1, c_array2, array_exists((x,y)->x>y,c_array1,c_array2) from array_test2 order by id;
```

```text
+-----------------+-------------------------+-------------------------------------------------------------+
| c_array1        | c_array2                | array_exists([x, y] -> x(0) > y(1), `c_array1`, `c_array2`) |
+-----------------+-------------------------+-------------------------------------------------------------+
| [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [0, 0, 1, 0, 1]                                             |
| [6, 7, 8]       | [10, 12, 13]            | [0, 0, 0]                                                   |
| [1]             | [-100]                  | [1]                                                         |
| NULL            | NULL                    | NULL                                                        |
+-----------------+-------------------------+-------------------------------------------------------------+
```
```sql
select *, array_exists(c_array1) from array_test2 order by id;
```

```text
+------+-----------------+-------------------------+--------------------------+
| id   | c_array1        | c_array2                | array_exists(`c_array1`) |
+------+-----------------+-------------------------+--------------------------+
|    1 | [1, 2, 3, 0, 5] | [10, 20, -40, 80, -100] | [1, 1, 1, 0, 1]          |
|    2 | [6, 7, 8]       | [10, 12, 13]            | [1, 1, 1]                |
|    3 | [1]             | [-100]                  | [1]                      |
|    4 | NULL            | NULL                    | NULL                     |
+------+-----------------+-------------------------+--------------------------+
```
