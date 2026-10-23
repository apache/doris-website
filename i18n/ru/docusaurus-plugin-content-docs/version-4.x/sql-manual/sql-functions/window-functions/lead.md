---
{
    "title": "LEAD",
    "language": "ru",
    "description": "LEAD() — оконная функция для доступа к данным из последующих строк без самосоединения."
}
---

## Описание {#description}

LEAD() — оконная функция для доступа к данным из последующих строк без самосоединения. Она возвращает значение из N-й строки после текущей строки в пределах раздела.

## Синтаксис {#syntax}

```sql
LEAD ( <expr> [ , <offset> [ , <default> ] ] )
```

## Параметры {#parameters}
| Параметр            | Описание                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| expr                | Выражение, значение которого требуется получить. Поддерживаемые типы: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/                                                                                                          |
| offset              | Необязательный параметр типа bigInt. Количество строк для отсчёта назад. По умолчанию: 1. |
| default             | Необязательный параметр того же типа, что и первый параметр. Значение, возвращаемое, если смещение выходит за пределы окна. По умолчанию: NULL                                                           |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа данных, что и входное выражение.

## Примеры {#examples}

<!-- setup-sql
CREATE TABLE stock_ticker (stock_symbol VARCHAR(10), closing_date DATETIME, closing_price DOUBLE) DISTRIBUTED BY HASH(stock_symbol) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO stock_ticker VALUES ('JDR','2014-09-13 00:00:00',12.86),('JDR','2014-09-14 00:00:00',12.89),('JDR','2014-09-15 00:00:00',12.94),('JDR','2014-09-16 00:00:00',12.55),('JDR','2014-09-17 00:00:00',14.03),('JDR','2014-09-18 00:00:00',14.75),('JDR','2014-09-19 00:00:00',13.98);
-->

Вычислите разницу между текущими продажами каждого продавца и его продажами на следующий день:

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
