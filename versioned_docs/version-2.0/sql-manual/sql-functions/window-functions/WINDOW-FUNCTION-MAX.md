---
{
    "title": "WINDOW_FUNCTION_MAX",
    "language": "en"
}
---

## WINDOW FUNCTION MAX
### description

The LEAD() method is used to calculate the maximum value within the window.

```sql
MAX([DISTINCT | ALL] expression) [OVER (analytic_clause)]
```

### example

Calculate the maximum value from the first row to the row after the current row

```sql
select x, property,   
max(x) over    
(   
order by property, x    
rows between unbounded preceding and 1 following    
) as 'local maximum'    
from int_t where property in ('prime','square');

| x | property | local maximum |
|---|----------|---------------|
| 2 | prime    | 3             |
| 3 | prime    | 5             |
| 5 | prime    | 7             |
| 7 | prime    | 7             |
| 1 | square   | 7             |
| 4 | square   | 9             |
| 9 | square   | 9             |
```

### keywords

    WINDOW,FUNCTION,MAX
