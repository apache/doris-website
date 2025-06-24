---
{
    "title": "ARRAY_REVERSE_SPLIT",
    "language": "en"
}
---

## Description

1. pass in two `ARRAY` of equal length, the second of which is an `Array<Boolean>`, and split the `arg` according to the split point to the right of the position in the `cond` that is `true`.
2. Higher-order functions, passed a lambda expression and at least one `ARRAY arg0`, split `arg0` by the right-hand side of the `true` position in the `cond` of the `Array<Boolean>` result of the operation on the lambda expression.

## Syntax

```sql
ARRAY_REVERSE_SPLIT(<arr>, <cond>)
ARRAY_REVERSE_SPLIT(<lambda>, <arr> [, ...])
```

## Parameters

| Parameter | Description | 
| --- | --- |
| `<lambda>` | A lambda expression where the input parameters must match the number of columns in the given array. The expression can execute valid scalar functions but does not support aggregate functions. |
| `<arr>` | ARRAY array |

## Return Value

Returns an ARRAY type result, where the array is split according to the specified condition.

## Example

```sql
select array_reverse_split([1,2,3,4,5], [1,0,1,0,0]);
```

```text
+-------------------------------------------------------------------------------+
| array_reverse_split([1, 2, 3, 4, 5], cast([1, 0, 1, 0, 0] as ARRAY<BOOLEAN>)) |
+-------------------------------------------------------------------------------+
| [[1], [2, 3], [4, 5]]                                                         |
+-------------------------------------------------------------------------------+
```

```sql
select array_reverse_split((x,y)->y, [1,2,3,4,5], [1,0,0,0,0]);
```

```text
+------------------------------------------------------------------------------------------------------------------------+
| array_reverse_split([1, 2, 3, 4, 5], cast(array_map((x, y) -> y, [1, 2, 3, 4, 5], [1, 0, 0, 0, 0]) as ARRAY<BOOLEAN>)) |
+------------------------------------------------------------------------------------------------------------------------+
| [[1], [2, 3, 4, 5]]                                                                                                    |
+------------------------------------------------------------------------------------------------------------------------+
```

```sql
select array_reverse_split((x,y)->(y+1), ['a', 'b', 'c', 'd'], [-1, -1, 0, -1]);
```

```text
+----------------------------------------------------------------------------------------------------------------------------------------+
| array_reverse_split(['a', 'b', 'c', 'd'], cast(array_map((x, y) -> (y + 1), ['a', 'b', 'c', 'd'], [-1, -1, 0, -1]) as ARRAY<BOOLEAN>)) |
+----------------------------------------------------------------------------------------------------------------------------------------+
| [["a", "b", "c"], ["d"]]                                                                                                               |
+----------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
select array_reverse_split(x->(year(x)>2013),["2020-12-12", "2013-12-12", "2015-12-12", null]);
```

```text
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_reverse_split(['2020-12-12', '2013-12-12', '2015-12-12', NULL], array_map(x -> (year(cast(x as DATEV2)) > 2013), ['2020-12-12', '2013-12-12', '2015-12-12', NULL])) |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [["2020-12-12"], ["2013-12-12", "2015-12-12"], [null]]                                                                                                                    |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
