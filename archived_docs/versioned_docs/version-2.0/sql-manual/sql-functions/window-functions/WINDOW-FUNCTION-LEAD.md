---
{
    "title": "WINDOW_FUNCTION_LEAD",
    "language": "en"
}
---

## WINDOW FUNCTION LEAD
### description

The LEAD() method is used to calculate the value of the current line several lines backwards.

```sql
LEAD(expr, offset, default) OVER (partition_by_clause order_by_clause)
```

### example

Calculate the trend of the closing price of the second day compared with the closing price of the day, that is, the closing price of the second day is higher or lower than that of the day.

```sql
select stock_symbol, closing_date, closing_price,    
case   
(lead(closing_price,1, 0)   
over (partition by stock_symbol order by closing_date)-closing_price) > 0   
when true then "higher"   
when false then "flat or lower"    
end as "trending"   
from stock_ticker    
order by closing_date;

| stock_symbol | closing_date        | closing_price | trending      |
|--------------|---------------------|---------------|---------------|
| JDR          | 2014-09-13 00:00:00 | 12.86         | higher        |
| JDR          | 2014-09-14 00:00:00 | 12.89         | higher        |
| JDR          | 2014-09-15 00:00:00 | 12.94         | flat or lower |
| JDR          | 2014-09-16 00:00:00 | 12.55         | higher        |
| JDR          | 2014-09-17 00:00:00 | 14.03         | higher        |
| JDR          | 2014-09-18 00:00:00 | 14.75         | flat or lower |
| JDR          | 2014-09-19 00:00:00 | 13.98         | flat or lower |
```

### keywords

    WINDOW,FUNCTION,LEAD
