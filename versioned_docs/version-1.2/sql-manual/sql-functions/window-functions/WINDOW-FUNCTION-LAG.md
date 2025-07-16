---
{
    "title": "WINDOW-FUNCTION-LAG",
    "language": "en"
}
---

## WINDOW FUNCTION LAG
### description

The LAG() method is used to calculate the value of the current line several lines ahead.

```sql
LAG(expr, offset, default) OVER (partition_by_clause order_by_clause)
```

### example

Calculate the previous day's closing price

```sql
select stock_symbol, closing_date, closing_price,    
lag(closing_price,1, 0) over (partition by stock_symbol order by closing_date) as "yesterday closing"   
from stock_ticker   
order by closing_date;

| stock_symbol | closing_date        | closing_price | yesterday closing |
|--------------|---------------------|---------------|-------------------|
| JDR          | 2014-09-13 00:00:00 | 12.86         | 0                 |
| JDR          | 2014-09-14 00:00:00 | 12.89         | 12.86             |
| JDR          | 2014-09-15 00:00:00 | 12.94         | 12.89             |
| JDR          | 2014-09-16 00:00:00 | 12.55         | 12.94             |
| JDR          | 2014-09-17 00:00:00 | 14.03         | 12.55             |
| JDR          | 2014-09-18 00:00:00 | 14.75         | 14.03             |
| JDR          | 2014-09-19 00:00:00 | 13.98         | 14.75             |
```

### keywords

    WINDOW,FUNCTION,LAG