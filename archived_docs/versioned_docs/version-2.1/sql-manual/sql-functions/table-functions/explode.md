---
{
    "title": "EXPLODE",
    "language": "en",
    "description": "The explode function takes an array as input and maps each element of the array to a separate row."
}
---

## Description

The `explode` function takes an array as input and maps each element of the array to a separate row. It is typically used in conjunction with LATERAL VIEW to flatten nested data structures into a standard tabular format. The main difference between explode and `explode_outer` lies in handling empty values.

## Syntax
```sql
EXPLODE(<array>)
EXPLODE_OUTER(<array>)
```

## Required Parameters

| Parameter | Description |
| -- | -- |
| `<arr>` | 	Array type |

## Return Value

When the array is not empty or NULL, the return values of `explode` and `explode_outer` are the same.

When the data is empty or NULL:

`explode` will not produce any rows and will filter out these records.

`explode_outer` if the array is empty, will generate a single row, but the expanded column value will be NULL. If the array is NULL, it will also retain a row and return NULL.

## Examples
```
select e1 from (select 1 k1) as t lateral view explode([1,2,3]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
|    1 |
|    2 |
|    3 |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode_outer(null) tmp1 as e1;
```

``` text
+------+
| e1   |
+------+
| NULL |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode([]) tmp1 as e1;
Empty set (0.010 sec)
```

```sql
select e1 from (select 1 k1) as t lateral view explode([null,1,null]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```

```sql
select e1 from (select 1 k1) as t lateral view explode_outer([null,1,null]) tmp1 as e1;
```

```text
+------+
| e1   |
+------+
| NULL |
|    1 |
| NULL |
+------+
```