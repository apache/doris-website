---
{
    "title": "LAG",
    "language": "en"
}
---

## Description

LAG() is a window function that accesses data from previous rows without performing a self-join. It retrieves values from a row that is N rows before the current row within a partition.

## Syntax

```sql
LAG ( <expr> [, <offset> [, <default> ] ] )
```

## Parameters
| Parameter           | Description                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| expr                | The expression whose value is to be retrieved, supported type: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/                                                      |
| offset              | Optional Bigint Type. Number of rows to look ahead. Default is 1. |
| default             | Optional Type is same as first param. Value to return when the offset goes beyond window bounds. Default is NULL               |

## Return Value

Returns the same data type as the input expression.

## Examples

Calculate the difference between each salesperson's current sales amount and the previous day's sales amount:

```sql
select stock_symbol, closing_date, closing_price,    
lag(closing_price,1, 0) over (partition by stock_symbol order by closing_date) as "yesterday closing"   
from stock_ticker   
order by closing_date;
```

```text
+--------------+---------------------+---------------+-------------------+
| stock_symbol | closing_date        | closing_price | yesterday closing |
| ------------ | ------------------- | ------------- | ----------------- |
| JDR          | 2014-09-13 00:00:00 | 12.86         | 0                 |
| JDR          | 2014-09-14 00:00:00 | 12.89         | 12.86             |
| JDR          | 2014-09-15 00:00:00 | 12.94         | 12.89             |
| JDR          | 2014-09-16 00:00:00 | 12.55         | 12.94             |
| JDR          | 2014-09-17 00:00:00 | 14.03         | 12.55             |
| JDR          | 2014-09-18 00:00:00 | 14.75         | 14.03             |
| JDR          | 2014-09-19 00:00:00 | 13.98         | 14.75             |
+--------------+---------------------+---------------+-------------------+
```
