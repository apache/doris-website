---
{
    "title": "ROW_NUMBER",
    "language": "en"
}
---

## Description

ROW_NUMBER() is a window function that assigns a unique sequential number to each row within a partition. Numbers start at 1 and increment continuously. Unlike RANK() and DENSE_RANK(), ROW_NUMBER() assigns different numbers even for identical values, ensuring each row has a unique number.

## Syntax

```sql
ROW_NUMBER()
```

## Return Value

Returns a BIGINT sequence number, starting from 1 and incrementing continuously. Numbers are unique within each partition.

## Examples

```sql
select x, y, row_number() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 3    |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    |
| 3   | 1   | 1    |
| 3   | 1   | 2    |
| 3   | 2   | 3    |
+-----+-----+------+
```