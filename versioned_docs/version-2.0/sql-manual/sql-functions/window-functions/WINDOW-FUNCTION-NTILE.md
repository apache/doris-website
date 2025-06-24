---
{
    "title": "WINDOW_FUNCTION_NTILE",
    "language": "en"
}
---

## WINDOW FUNCTION NTILE
### description

For NTILE(n), this function will divides rows in a sorted partition into a specific number of groups(in this case, n buckets). Each group is assigned a bucket number starting at one. For the case that cannot be distributed evenly, rows are preferentially allocated to the bucket with the smaller number. The number of rows in all buckets cannot differ by more than 1. For now, n must be constant positive integer.

```sql
NTILE(n) OVER(partition_by_clause order_by_clause)
```

### example

```sql
select x, y, ntile(2) over(partition by x order by y) as ntile from int_t;

| x | y    | rank     |
|---|------|----------|
| 1 | 1    | 1        |
| 1 | 2    | 1        |
| 1 | 2    | 2        |
| 2 | 1    | 1        |
| 2 | 2    | 1        |
| 2 | 3    | 2        |
| 3 | 1    | 1        |
| 3 | 1    | 1        |
| 3 | 2    | 2        |
```

### keywords

    WINDOW,FUNCTION,NTILE
