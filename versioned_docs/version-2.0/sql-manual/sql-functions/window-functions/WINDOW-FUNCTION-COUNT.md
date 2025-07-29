---
{
    "title": "WINDOW_FUNCTION_COUNT",
    "language": "en"
}
---

## WINDOW FUNCTION COUNT
### description

Count the number of occurrences of data in the window

```sql
COUNT(expression) [OVER (analytic_clause)]
```

### example

Count the number of occurrences of x from the current row to the first row.

```sql
select x, property,   
count(x) over   
(   
partition by property    
order by x    
rows between unbounded preceding and current row    
) as 'cumulative total'    
from int_t where property in ('odd','even');

 | x  | property | cumulative count |
 |----|----------|------------------|
 | 2  | even     | 1                |
 | 4  | even     | 2                |
 | 6  | even     | 3                |
 | 8  | even     | 4                |
 | 10 | even     | 5                |
 | 1  | odd      | 1                |
 | 3  | odd      | 2                |
 | 5  | odd      | 3                |
 | 7  | odd      | 4                |
 | 9  | odd      | 5                |
```

### keywords

    WINDOW,FUNCTION,COUNT
