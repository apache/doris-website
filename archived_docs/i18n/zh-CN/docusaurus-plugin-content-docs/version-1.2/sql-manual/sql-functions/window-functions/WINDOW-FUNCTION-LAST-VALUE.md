---
{
    "title": "WINDOW-FUNCTION-LAST_VALUE",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION LAST_VALUE
## 描述

LAST_VALUE() 返回窗口范围内的最后一个值。与 FIRST_VALUE() 相反。

```sql
LAST_VALUE(expr) OVER(partition_by_clause order_by_clause [window_clause])
```

## 举例

使用FIRST_VALUE()举例中的数据：

```sql
select country, name,    
last_value(greeting)   
over (partition by country order by name, greeting) as greeting   
from mail_merge;

| country | name    | greeting     |
|---------|---------|--------------|
| Germany | Boris   | Guten morgen |
| Germany | Michael | Guten morgen |
| Sweden  | Bjorn   | Tja          |
| Sweden  | Mats    | Tja          |
| USA     | John    | Hello        |
| USA     | Pete    | Hello        |
```

### keywords

    WINDOW,FUNCTION,LAST_VALUE