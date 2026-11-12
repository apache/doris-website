---
{
    "title": "ARRAY_COMPACT",
    "language": "en"
}
---

## array_compact

array_compact

### description

Removes consecutive duplicate elements from an array. The order of result values is determined by the order in the source array.

#### Syntax

`Array<T> array_compact(arr)`

#### Arguments

`arr` — The array to inspect.

#### Returned value

The array without continuous duplicate.

Type: Array.

### example

```
select array_compact([1, 2, 3, 3, null, null, 4, 4]);

+----------------------------------------------------+
| array_compact(ARRAY(1, 2, 3, 3, NULL, NULL, 4, 4)) |
+----------------------------------------------------+
| [1, 2, 3, NULL, 4]                                 |
+----------------------------------------------------+

select array_compact(['aaa','aaa','bbb','ccc','ccccc',null, null,'dddd']);

+-------------------------------------------------------------------------------+
| array_compact(ARRAY('aaa', 'aaa', 'bbb', 'ccc', 'ccccc', NULL, NULL, 'dddd')) |
+-------------------------------------------------------------------------------+
| ['aaa', 'bbb', 'ccc', 'ccccc', NULL, 'dddd']                                  |
+-------------------------------------------------------------------------------+

select array_compact(['2015-03-13','2015-03-13']);

+--------------------------------------------------+
| array_compact(ARRAY('2015-03-13', '2015-03-13')) |
+--------------------------------------------------+
| ['2015-03-13']                                   |
+--------------------------------------------------+
```

### keywords

ARRAY,COMPACT,ARRAY_COMPACT

