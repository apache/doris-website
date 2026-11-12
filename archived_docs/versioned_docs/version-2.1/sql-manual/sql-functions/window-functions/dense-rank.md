---
{
    "title": "DENSE_RANK",
    "language": "en",
    "description": "DENSERANK() is a window function used to calculate rankings within a group. Unlike RANK(), DENSERANK() returns consecutive rankings without gaps."
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

Setup — create the `int_t` table and load the rows the example uses:

```sql
CREATE TABLE int_t (x INT, y INT)
DISTRIBUTED BY HASH(x) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO int_t VALUES
    (1, 1), (1, 2), (1, 2),
    (2, 1), (2, 2), (2, 3),
    (3, 1), (3, 1), (3, 2);
```

```sql
select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
```

Identical values within a partition receive the same rank, and the ranks are consecutive (no gaps — that is how `DENSE_RANK` differs from `RANK`):

```text
+------+------+------+
| x    | y    | rank |
+------+------+------+
|    1 |    1 |    1 |
|    1 |    2 |    2 |
|    1 |    2 |    2 |
|    2 |    1 |    1 |
|    2 |    2 |    2 |
|    2 |    3 |    3 |
|    3 |    1 |    1 |
|    3 |    1 |    1 |
|    3 |    2 |    2 |
+------+------+------+
```
