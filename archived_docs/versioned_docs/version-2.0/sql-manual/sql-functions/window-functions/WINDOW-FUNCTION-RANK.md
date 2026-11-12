---
{
    "title": "WINDOW_FUNCTION_RANK",
    "language": "en"
}
---

## WINDOW FUNCTION RANK
### description

The RANK() function is used to represent rankings. Unlike DENSE_RANK(), RANK() will have vacancies. For example, if there are two 1s in a row, the third number in RANK() is 3, not 2.

```sql
RANK() OVER(partition_by_clause order_by_clause)
```

### example

rank by x

```sql
select x, y, rank() over(partition by x order by y) as rank from int_t;

| x  | y    | rank     |
|----|------|----------|
| 1  | 1    | 1        |
| 1  | 2    | 2        |
| 1  | 2    | 2        |
| 2  | 1    | 1        |
| 2  | 2    | 2        |
| 2  | 3    | 3        |
| 3  | 1    | 1        |
| 3  | 1    | 1        |
| 3  | 2    | 3        |
```

### keywords

    WINDOW,FUNCTION,RANK
