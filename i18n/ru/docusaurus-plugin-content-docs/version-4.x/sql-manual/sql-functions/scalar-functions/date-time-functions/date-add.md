---
{
    "title": "DATE_ADD",
    "language": "ru",
    "description": "Функция DATEADD добавляет указанный интервал времени к заданному значению даты или времени и возвращает результат вычисления."
}
---

## Описание {#description}

Функция DATE_ADD добавляет указанный интервал времени к заданному значению даты или времени и возвращает результат вычисления.

- Поддерживаются входные значения типов DATE, DATETIME, TIMESTAMPTZ (например, '2023-12-31', '2023-12-31 23:59:59', '2023-12-31 23:59:59+08:00').
- Интервал времени задаётся числовым значением (`expr`) и единицей измерения (`time_unit`). Если `expr` положительное, интервал прибавляется, а если отрицательное, соответствующий интервал вычитается.

Поведение этой функции соответствует поведению [функции date_add](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) в MySQL.

## Псевдонимы {#aliases}

- days_add
- adddate

## Синтаксис {#syntax}

```sql
DATE_ADD(<date_or_time_expr>, INTERVAL <expr> <time_unit>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<date_or_time_expr>` | Значение даты/времени для обработки. Поддерживаемые типы: datetime или date, с максимальной точностью секунд до шести знаков после десятичной точки (например, 2022-12-28 23:59:59.999999). Подробнее о форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<expr>` | Добавляемый интервал времени. Для простых единиц (например, `YEAR`) используется тип `INT`; для составных единиц (например, `YEAR_MONTH`) используется тип `STRING`, при этом любые нецифровые символы допускаются в качестве разделителей. Поэтому, например, `INTERVAL 6/4 HOUR_MINUTE` Doris интерпретирует как 6 часов 4 минуты, а не как 1 час 30 минут (6/4 == 1.5). Если для составной единицы задано слишком короткое значение интервала, значение старшей единицы устанавливается в 0. Знак этого значения определяется только тем, является ли первый нецифровой символ знаком `-`. |
| `<time_unit>` | Значения перечисления: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND, YEAR_MONTH, DAY_HOUR, DAY_MINUTE, DAY_SECOND, DAY_MICROSECOND, HOUR_MINUTE, HOUR_SECOND, HOUR_MICROSECOND, MINUTE_SECOND, MINUTE_MICROSECOND, SECOND_MICROSECOND | 

| time_unit          | Ожидаемый формат (любые нецифровые символы допускаются в качестве разделителей) |
| ------------------ | ----------------------------------------- |
| YEAR               | 'YEARS'                                   |
| QUARTER            | 'QUARTERS'                                |
| MONTH              | 'MONTHS'                                  |
| WEEK               | 'WEEKS'                                   |
| DAY                | 'DAYS'                                    |
| HOUR               | 'HOURS'                                   |
| MINUTE             | 'MINUTES'                                 |
| SECOND             | 'SECONDS'                                 |
| MICROSECOND        | 'MICROSECONDS'                            |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

## Возвращаемое значение {#return-value}

Возвращает результат того же типа, что и <date_or_time_expr>:
- При входном значении типа DATE возвращает DATE (только дату);
- При входном значении типа DATETIME возвращает DATETIME (дату и время);
- При входном значении типа TIMESTAMPTZ возвращает TIMESTAMPTZ (дату, время и смещение часового пояса).
- Если входное значение содержит дробную часть секунд (например, '2024-01-01 12:00:00.123'), число знаков после десятичной точки сохраняется, но не может превышать шести.

Особые случаи:
- Если любой из параметров равен NULL, возвращается NULL;
- При недопустимой единице измерения или нечисловом значении expr возвращается ошибка;
- Для составных единиц, если входное значение содержит слишком много частей или любая из них превышает максимально допустимое значение 922337203685477579, возвращается ошибка.
- Если результат вычисления выходит за диапазон типа даты (например, раньше '0000-00-00 23:59:59' или позже '9999-12-31 23:59:59'), возвращается ошибка.
- Если в следующем месяце недостаточно дней для указанной даты, результат автоматически устанавливается на последний день следующего месяца.

## Примеры {#examples}

```sql
-- Add days
select date_add(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+

-- Add quarters
mysql> select DATE_ADD(cast('2023-01-01' as date), INTERVAL 1 QUARTER);
+--------------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 QUARTER) |
+--------------------------------------------+
| 2023-04-01                                 |
+--------------------------------------------+

-- Add weeks
mysql> select DATE_ADD('2023-01-01', INTERVAL 1 WEEK);
+-----------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 WEEK) |
+-----------------------------------------+
| 2023-01-08                              |
+-----------------------------------------+

-- Add months, since February 2023 only has 28 days, January 31 plus one month returns February 28
mysql> select DATE_ADD('2023-01-31', INTERVAL 1 MONTH);
+------------------------------------------+
| DATE_ADD('2023-01-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

-- Negative number test
mysql> select DATE_ADD('2019-01-01', INTERVAL -3 DAY);
+-----------------------------------------+
| DATE_ADD('2019-01-01', INTERVAL -3 DAY) |
+-----------------------------------------+
| 2018-12-29                              |
+-----------------------------------------+

-- Cross-year hour addition
mysql> select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR);
+--------------------------------------------------+
| DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR) |
+--------------------------------------------------+
| 2024-01-01 01:00:00                              |
+--------------------------------------------------+

-- Add DAY_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND);
+-------------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND) |
+-------------------------------------------------------------------+
| 2025-10-24 11:12:13                                               |
+-------------------------------------------------------------------+

-- Add DAY_HOUR
mysql>  select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR);
+----------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR) |
+----------------------------------------------------------+
| 2025-10-24 12:10:10                                      |
+----------------------------------------------------------+

-- For compound units, accept all non-numeric characters as separators.
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR);
+----------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR) |
+----------------------------------------------------------------+
| 2025-10-24 12:10:10                                            |
+----------------------------------------------------------------+

-- Add MINUTE_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND);
+---------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND) |
+---------------------------------------------------------------+
| 2025-10-23 10:11:11                                           |
+---------------------------------------------------------------+

-- Add SECOND_MICROSECOND
mysql>  select date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND);
+---------------------------------------------------------------------------+
| date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND) |
+---------------------------------------------------------------------------+
| 2025-10-10 10:10:11.223456                                                |
+---------------------------------------------------------------------------+

-- For composite units, the sign of the time interval is determined only by whether the first non-digit character is `-`
-- All subsequent `-` are considered part of the delimiter
select 
        DATE_ADD('2025-10-23 10:10:10', INTERVAL '#-1:-1' MINUTE_SECOND) AS first_not_sub,
        DATE_ADD('2025-10-23 10:10:10', INTERVAL '  -1:1' MINUTE_SECOND) AS first_sub;
+---------------------+---------------------+
| first_not_sub       | first_sub           |
+---------------------+---------------------+
| 2025-10-23 10:11:11 | 2025-10-23 10:09:09 |
+---------------------+---------------------+

-- For composite units, if the input time interval is too short, the value of the larger unit will be set to 0.
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1' MINUTE_SECOND) AS minute_interval_is_zero
+-------------------------+
| minute_interval_is_zero |
+-------------------------+
| 2025-10-23 10:10:11     |
+-------------------------+

-- Example of TimestampTz type, SET time_zone = '+08:00'
select DATE_ADD('2023-01-01 23:22:33+03:00', INTERVAL 1 DAY);
+-------------------------------------------------------+
| DATE_ADD('2023-01-01 23:22:33+03:00', INTERVAL 1 DAY) |
+-------------------------------------------------------+
| 2023-01-03 04:22:33+08:00                             |
+-------------------------------------------------------+

-- If the number of time intervals input is excessive, return an error
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:2:3.4' SECOND_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation second_microsecond_add of 1:2:3.4 is invalid

-- For composite units, if the value of any part exceeds the maximum value of 922337203685477580
-- return an error
select DATE_ADD('2025-10-10 1:2:3', INTERVAL '922337203685477580' DAY_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_microsecond_add of 2025-10-10 01:02:03, 922337203685477580 out of range

-- Illegal unit
select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 sa);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'sa' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 50)

-- Parameter is NULL, returns NULL
mysql> select DATE_ADD(NULL, INTERVAL 1 MONTH);
+----------------------------------+
| DATE_ADD(NULL, INTERVAL 1 MONTH) |
+----------------------------------+
| NULL                             |
+----------------------------------+

-- Calculated result is not in date range [0000,9999], returns error
mysql> select DATE_ADD('0001-01-28', INTERVAL -2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 0001-01-28, -2 out of range

mysql> select DATE_ADD('9999-01-28', INTERVAL 2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 9999-01-28, 2 out of range
```
