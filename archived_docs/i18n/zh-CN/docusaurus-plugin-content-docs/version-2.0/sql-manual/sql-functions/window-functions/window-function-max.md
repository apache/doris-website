---
{
    "title": "WINDOW_FUNCTION_MAX",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION MAX
## 描述

LEAD() 方法用来计算窗口内的最大值。

```sql
MAX([DISTINCT | ALL] expression) [OVER (analytic_clause)]
```

## 举例

计算从第一行到当前行之后一行的最大值

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

​    WINDOW,FUNCTION,MAX