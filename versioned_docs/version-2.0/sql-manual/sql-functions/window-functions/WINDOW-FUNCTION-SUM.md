---
{
    "title": "WINDOW_FUNCTION_SUM",
    "language": "en"
}
---

## WINDOW FUNCTION SUM
### description

Calculate the sum of the data in the window

```sql
SUM([ALL] expression) [OVER (analytic_clause)]
```

### example

Group by property, and calculate the sum of the x columns of the current row and the previous row within the group.

```sql
select x, property,   
sum(x) over    
(   
partition by property   
order by x   
rows between 1 preceding and 1 following    
) as 'moving total'    
from int_t where property in ('odd','even');

| x  | property | moving total |
|----|----------|--------------|
| 2  | even     | 6            |
| 4  | even     | 12           |
| 6  | even     | 18           |
| 8  | even     | 24           |
| 10 | even     | 18           |
| 1  | odd      | 4            |
| 3  | odd      | 9            |
| 5  | odd      | 15           |
| 7  | odd      | 21           |
| 9  | odd      | 16           |
```

### keywords

    WINDOW,FUNCTION,SUM
