---
{
    "title": "WINDOW_FUNCTION_MIN",
    "language": "en"
}
---

## WINDOW FUNCTION MIN
### description

The LEAD() method is used to calculate the minimum value within the window.

```sql
MAX([DISTINCT | ALL] expression) [OVER (analytic_clause)]
```

### example

Calculate the minimum value from the first row to the row after the current row

```sql
select x, property,   
min(x) over    
(    
order by property, x desc    
rows between unbounded preceding and 1 following   
) as 'local minimum'   
from int_t where property in ('prime','square');
| x | property | local minimum |
|---|----------|---------------|
| 7 | prime    | 5             |
| 5 | prime    | 3             |
| 3 | prime    | 2             |
| 2 | prime    | 2             |
| 9 | square   | 2             |
| 4 | square   | 1             |
| 1 | square   | 1             |
```

### keywords

    WINDOW,FUNCTION,MIN
