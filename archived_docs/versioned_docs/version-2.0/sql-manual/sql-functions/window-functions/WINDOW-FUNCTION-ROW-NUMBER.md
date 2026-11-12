---
{
    "title": "WINDOW_FUNCTION_ROW_NUMBER",
    "language": "en"
}
---

## WINDOW FUNCTION ROW_NUMBER
### description

Returns a continuously increasing integer starting from 1 for each row of each Partition. Unlike RANK() and DENSE_RANK(), the value returned by ROW_NUMBER() does not repeat or appear vacant, and is continuously incremented.

```sql
ROW_NUMBER() OVER(partition_by_clause order_by_clause)
```

### example

```sql
select x, y, row_number() over(partition by x order by y) as rank from int_t;

| x | y    | rank     |
|---|------|----------|
| 1 | 1    | 1        |
| 1 | 2    | 2        |
| 1 | 2    | 3        |
| 2 | 1    | 1        |
| 2 | 2    | 2        |
| 2 | 3    | 3        |
| 3 | 1    | 1        |
| 3 | 1    | 2        |
| 3 | 2    | 3        |
```

### keywords

    WINDOW,FUNCTION,ROW_NUMBER
