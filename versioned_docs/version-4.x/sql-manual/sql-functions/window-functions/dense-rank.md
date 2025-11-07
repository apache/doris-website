---
{
    "title": "DENSE_RANK",
    "language": "en"
}
---

## Description

DENSE_RANK() is a window function used to calculate rankings within a group. Unlike RANK(), DENSE_RANK() returns consecutive rankings without gaps. The ranking values start from 1 and increment sequentially. When there are identical values, they will receive the same rank.

## Syntax

```sql
DENSE_RANK()
```

## Return Value

Returns a BIGINT type ranking value, starting from 1.

## Examples

```sql
select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 2    | -- Same values receive the same rank |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    | -- Rankings are consecutive, no gaps |
| 3   | 1   | 1    |
| 3   | 1   | 1    |
| 3   | 2   | 2    |
+-----+-----+------+
```