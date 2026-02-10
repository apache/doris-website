---
{
    "title": "LEAD",
    "language": "en",
    "description": "LEAD() is a window function used to access data from subsequent rows without performing a self-join."
}
---

## Description

LEAD() is a window function used to access data from subsequent rows without performing a self-join. It retrieves the value from the Nth row after the current row within a partition.

## Syntax

```sql
LEAD ( <expr> [ , <offset> [ , <default> ] ] )
```

## Parameters
| Parameter           | Description                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| expr                | The expression whose value needs to be retrieved                                                                                                          |
| offset              | Number of rows to look backward. |
| default             | Default value to return when the offset goes beyond the window range.                                                            |

## Return Value

Returns the same data type as the input expression.

## Examples

Calculate the difference between each salesperson's current sales and next day's sales:

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
```

```text
+--------------+---------------------+---------------+---------------+
| stock_symbol | closing_date        | closing_price | trending      |
| ------------ | ------------------- | ------------- | ------------- |
| JDR          | 2014-09-13 00:00:00 | 12.86         | higher        |
| JDR          | 2014-09-14 00:00:00 | 12.89         | higher        |
| JDR          | 2014-09-15 00:00:00 | 12.94         | flat or lower |
| JDR          | 2014-09-16 00:00:00 | 12.55         | higher        |
| JDR          | 2014-09-17 00:00:00 | 14.03         | higher        |
| JDR          | 2014-09-18 00:00:00 | 14.75         | flat or lower |
| JDR          | 2014-09-19 00:00:00 | 13.98         | flat or lower |
+--------------+---------------------+---------------+---------------+
```