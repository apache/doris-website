---
{
    "title": "WINDOW_FUNCTION_DENSE_RANK",
    "language": "en"
}
---

## WINDOW FUNCTION DENSE_RANK
### description

The DENSE_RANK() function is used to represent rankings. Unlike RANK(), DENSE_RANK() does not have vacancies. For example, if there are two parallel 1s, the third number of DENSE_RANK() is still 2, and the third number of RANK() is 3.

```sql
DENSE_RANK() OVER(partition_by_clause order_by_clause)
```

### example

Group by the property column to rank column x:

```sql
 select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
 
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
 | 3  | 2    | 2        |
```

### keywords

    WINDOW,FUNCTION,DENSE_RANK
