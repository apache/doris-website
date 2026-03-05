---
{
    "title": "ARRAY_LAST",
    "language": "en"
}
---

## array_last

array_last

### description
Returns the last element in the array for which func(arr1[i]) returns something other than 0.

#### Syntax

```
T array_last(lambda, ARRAY<T>)
```

Use a lambda bool expression and an array as the input parameters, the lambda expression is used to evaluate the internal data of other input ARRAY parameters.

### example

```
mysql> select array_last(x->x>2, [1,2,3,0]) ;
+------------------------------------------------------------------------------------------------+
| array_last(array_filter(ARRAY(1, 2, 3, 0), array_map([x] -> x(0) > 2, ARRAY(1, 2, 3, 0))), -1) |
+------------------------------------------------------------------------------------------------+
|                                                                                              3 |
+------------------------------------------------------------------------------------------------+


mysql> select array_last(x->x>4, [1,2,3,0]) ; 
+------------------------------------------------------------------------------------------------+
| array_last(array_filter(ARRAY(1, 2, 3, 0), array_map([x] -> x(0) > 4, ARRAY(1, 2, 3, 0))), -1) |
+------------------------------------------------------------------------------------------------+
|                                                                                           NULL |
+------------------------------------------------------------------------------------------------+


```

### keywords

ARRAY, LAST, ARRAY_LAST
