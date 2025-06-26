---
{
    "title": "ARRAY_FIRST",
    "language": "en"
}
---

## array_first

array_first

### description
Returns the first element in the array for which func(arr1[i]) returns something other than 0.

#### Syntax

```
T array_first(lambda, ARRAY<T>)
```

Use a lambda bool expression and an array as the input parameters, the lambda expression is used to evaluate the internal data of other input ARRAY parameters.

### example

```
mysql> select array_first(x->x>2, [1,2,3,0]) ;
+------------------------------------------------------------------------------------------------+
| array_first(array_filter(ARRAY(1, 2, 3, 0), array_map([x] -> x(0) > 2, ARRAY(1, 2, 3, 0))), -1) |
+------------------------------------------------------------------------------------------------+
|                                                                                              3 |
+------------------------------------------------------------------------------------------------+


mysql> select array_first(x->x>4, [1,2,3,0]) ; 
+------------------------------------------------------------------------------------------------+
| array_first(array_filter(ARRAY(1, 2, 3, 0), array_map([x] -> x(0) > 4, ARRAY(1, 2, 3, 0))), -1) |
+------------------------------------------------------------------------------------------------+
|                                                                                           NULL |
+------------------------------------------------------------------------------------------------+


mysql> select array_first(x->x>1, [1,2,3,0]) ;
+---------------------------------------------------------------------------------------------+
| array_first(array_filter(ARRAY(1, 2, 3, 0), array_map([x] -> x > 1, ARRAY(1, 2, 3, 0))), 1) |
+---------------------------------------------------------------------------------------------+
|                                                                                           2 |
+---------------------------------------------------------------------------------------------+
```


### keywords

ARRAY, LAST, array_first
