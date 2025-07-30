---
{
    "title": "WINDOW-FUNCTION-COUNT",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION COUNT
## 描述

计算窗口内数据出现次数

```sql
COUNT(expression) [OVER (analytic_clause)]
```

## 举例

计算从当前行到第一行x出现的次数。

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