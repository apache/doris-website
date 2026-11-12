---
{
    "title": "WINDOW-FUNCTION-FIRST_VALUE",
    "language": "zh-CN"
}
---

## WINDOW FUNCTION FIRST_VALUE
## 描述

FIRST_VALUE() 返回窗口范围内的第一个值。

```sql
FIRST_VALUE(expr) OVER(partition_by_clause order_by_clause [window_clause])
```

## 举例


我们有如下数据

```sql
 select name, country, greeting from mail_merge;
 
 | name    | country | greeting     |
 |---------|---------|--------------|
 | Pete    | USA     | Hello        |
 | John    | USA     | Hi           |
 | Boris   | Germany | Guten tag    |
 | Michael | Germany | Guten morgen |
 | Bjorn   | Sweden  | Hej          |
 | Mats    | Sweden  | Tja          |
```

使用 FIRST_VALUE()，根据 country 分组，返回每个分组中第一个 greeting 的值：

```sql
select country, name,    
first_value(greeting)    
over (partition by country order by name, greeting) as greeting from mail_merge;

| country | name    | greeting  |
|---------|---------|-----------|
| Germany | Boris   | Guten tag |
| Germany | Michael | Guten tag |
| Sweden  | Bjorn   | Hej       |
| Sweden  | Mats    | Hej       |
| USA     | John    | Hi        |
| USA     | Pete    | Hi        |
```

### keywords

    WINDOW,FUNCTION,FIRST_VALUE