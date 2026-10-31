---
{
    "title": "WINDOW-FUNCTION-AVG",
    "language": "en"
}
---

## WINDOW FUNCTION AVG
### description

Calculate the mean of the data within the window

```sql
AVG([ALL] *expression*) [OVER (*analytic_clause*)]
```

### example

Calculate the x-average of the current row and the rows before and after it

```sql
select x, property,    
avg(x) over    
(   
partition by property    
order by x    
rows between 1 preceding and 1 following    
) as 'moving average'    
from int_t where property in ('odd','even');

 | x  | property | moving average |
 |----|----------|----------------|
 | 2  | even     | 3              |
 | 4  | even     | 4              |
 | 6  | even     | 6              |
 | 8  | even     | 8              |
 | 10 | even     | 9              |
 | 1  | odd      | 2              |
 | 3  | odd      | 3              |
 | 5  | odd      | 5              |
 | 7  | odd      | 7              |
 | 9  | odd      | 8              |
```

### keywords

    WINDOW,FUNCTION,AVG