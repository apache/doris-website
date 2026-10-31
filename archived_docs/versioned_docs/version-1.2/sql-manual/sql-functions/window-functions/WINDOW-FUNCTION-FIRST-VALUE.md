---
{
    "title": "WINDOW-FUNCTION-FIRST_VALUE",
    "language": "en"
}
---

## WINDOW FUNCTION FIRST_VALUE
### description

FIRST_VALUE() returns the first value in the window's range.

```sql
FIRST_VALUE(expr) OVER(partition_by_clause order_by_clause [window_clause])
```

### example


We have the following data

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

Use FIRST_VALUE() to group by country and return the value of the first greeting in each group:

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