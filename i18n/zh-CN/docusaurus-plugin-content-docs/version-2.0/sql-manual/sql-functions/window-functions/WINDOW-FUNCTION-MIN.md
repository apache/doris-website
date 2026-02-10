---
{
    "title": "WINDOW_FUNCTION_MIN",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION MIN
## 描述

LEAD() 方法用来计算窗口内的最小值。

```sql
MAX([DISTINCT | ALL] expression) [OVER (analytic_clause)]
```

## 举例

计算从第一行到当前行之后一行的最小值

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
