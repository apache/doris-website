---
{
    "title": "ARRAY_FILTER",
    "language": "en"
}
---

## Description

Use the lambda expression as the input parameter to calculate and filter the data of the ARRAY column of the other input parameter.
And filter out the values of 0 and NULL in the result.

## Syntax

```sql
ARRAY_FILTER(<lambda>, <arr>)
ARRAY_FILTER(<arr>, <filter_column>)
```

## Parameters

| Parameter | Description | 
| --- | --- |
| `<lambda>` | A lambda expression where the input parameters must match the number of columns in the given array. The expression can execute valid scalar functions but does not support aggregate functions. |
| `<arr>` | ARRAY array |

## Return Value

Performs the specified expression calculation on the internal data of the input ARRAY parameter, filtering out 0 and NULL values from the result.

## Example

```sql
select c_array,array_filter(c_array,[0,1,0]) from array_test;
```

```text
+-----------------+----------------------------------------------------+
| c_array         | array_filter(`c_array`, ARRAY(FALSE, TRUE, FALSE)) |
+-----------------+----------------------------------------------------+
| [1, 2, 3, 4, 5] | [2]                                                |
| [6, 7, 8]       | [7]                                                |
| []              | []                                                 |
| NULL            | NULL                                               |
+-----------------+----------------------------------------------------+
```

```sql
select array_filter(x->(x > 1),[1,2,3,0,null]);
```

```text
+----------------------------------------------------------------------------------------------+
| array_filter(ARRAY(1, 2, 3, 0, NULL), array_map([x] -> (x(0) > 1), ARRAY(1, 2, 3, 0, NULL))) |
+----------------------------------------------------------------------------------------------+
| [2, 3]                                                                                       |
+----------------------------------------------------------------------------------------------+
```

```sql
select *, array_filter(x->x>0,c_array2) from array_test2;
```

```text
+------+-----------------+-------------------------+------------------------------------------------------------------+
| id   | c_array1        | c_array2                | array_filter(`c_array2`, array_map([x] -> x(0) > 0, `c_array2`)) |
+------+-----------------+-------------------------+------------------------------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [10, 20, 80]                                                     |
|    2 | [6, 7, 8]       | [10, 12, 13]            | [10, 12, 13]                                                     |
|    3 | [1]             | [-100]                  | []                                                               |
|    4 | NULL            | NULL                    | NULL                                                             |
+------+-----------------+-------------------------+------------------------------------------------------------------+
```

```sql
select *, array_filter(x->x%2=0,c_array2) from array_test2;
```

```text
+------+-----------------+-------------------------+----------------------------------------------------------------------+
| id   | c_array1        | c_array2                | array_filter(`c_array2`, array_map([x] -> x(0) % 2 = 0, `c_array2`)) |
+------+-----------------+-------------------------+----------------------------------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [10, 20, -40, 80, -100]                                              |
|    2 | [6, 7, 8]       | [10, 12, 13]            | [10, 12]                                                             |
|    3 | [1]             | [-100]                  | [-100]                                                               |
|    4 | NULL            | NULL                    | NULL                                                                 |
+------+-----------------+-------------------------+----------------------------------------------------------------------+
```

```sql
select *, array_filter(x->(x*(-10)>0),c_array2) from array_test2;
```

```text
+------+-----------------+-------------------------+----------------------------------------------------------------------------+
| id   | c_array1        | c_array2                | array_filter(`c_array2`, array_map([x] -> (x(0) * (-10) > 0), `c_array2`)) |
+------+-----------------+-------------------------+----------------------------------------------------------------------------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [-40, -100]                                                                |
|    2 | [6, 7, 8]       | [10, 12, 13]            | []                                                                         |
|    3 | [1]             | [-100]                  | [-100]                                                                     |
|    4 | NULL            | NULL                    | NULL                                                                       |
+------+-----------------+-------------------------+----------------------------------------------------------------------------+
```

```sql
select *, array_filter(x->x>0, array_map((x,y)->(x>y), c_array1,c_array2)) as res from array_test2;
```

```text
+------+-----------------+-------------------------+--------+
| id   | c_array1        | c_array2                | res    |
+------+-----------------+-------------------------+--------+
|    1 | [1, 2, 3, 4, 5] | [10, 20, -40, 80, -100] | [1, 1] |
|    2 | [6, 7, 8]       | [10, 12, 13]            | []     |
|    3 | [1]             | [-100]                  | [1]    |
|    4 | NULL            | NULL                    | NULL   |
+------+-----------------+-------------------------+--------+
```



