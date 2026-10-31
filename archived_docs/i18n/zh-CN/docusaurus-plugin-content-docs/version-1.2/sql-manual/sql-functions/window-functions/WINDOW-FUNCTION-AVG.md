---
{
    "title": "WINDOW-FUNCTION-AVG",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION AVG
## 描述

计算窗口内数据的平均值

```sql
AVG([ALL] *expression*) [OVER (*analytic_clause*)]
```

## 举例

计算当前行和它前后各一行数据的x平均值

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