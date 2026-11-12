---
{
    "title": "WINDOW-FUNCTION-LAST_VALUE",
    "language": "en"
}
---

## WINDOW FUNCTION LAST_VALUE
### description

LAST_VALUE() returns the last value in the window range. Opposite of FIRST_VALUE() .

```sql
LAST_VALUE(expr) OVER(partition_by_clause order_by_clause [window_clause])
```

### example

Using the data from the FIRST_VALUE() example:

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