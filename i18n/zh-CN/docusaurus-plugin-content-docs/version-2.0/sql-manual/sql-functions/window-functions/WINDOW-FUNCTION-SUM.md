---
{
    "title": "WINDOW_FUNCTION_SUM",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION SUM
## 描述

计算窗口内数据的和

```sql
SUM([ALL] expression) [OVER (analytic_clause)]
```

## 举例

按照 property 进行分组，在组内计算当前行以及前后各一行的x列的和。

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
