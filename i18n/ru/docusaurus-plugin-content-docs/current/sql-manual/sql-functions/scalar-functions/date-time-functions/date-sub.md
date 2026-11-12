---
{
    "title": "DATE_SUB",
    "language": "ru",
    "description": "Функция DATESUB вычитает заданный временной интервал из указанного значения даты или времени и возвращает вычисленный результат."
}
---

## Описание {#description}

Функция DATE_SUB вычитает заданный временной интервал из значения даты или времени и возвращает вычисленный результат. Она поддерживает входные значения типов `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. Временной интервал задаётся числовым значением и единицей измерения.

Поведение этой функции соответствует поведению [функции date_sub](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) в MySQL.

## Псевдонимы {#aliases}

- days_sub
- subdate

## Синтаксис {#syntax}

```sql
DATE_SUB(<date_or_time_part>, INTERVAL <expr> <time_unit>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<date_or_time_part>` | Допустимое значение даты. Поддерживаются типы `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. Подробные сведения о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<expr>` | Вычитаемый временной интервал. Для простых единиц (например, `YEAR`) используется тип `INT`, а для составных единиц (например, `YEAR_MONTH`) используется тип `STRING`, причём разделителями могут служить любые нецифровые символы. Поэтому, например, `INTERVAL 6/4 HOUR_MINUTE` будет распознан Doris как 6 часов 4 минуты, а не как 1 час 30 минут (6/4 == 1.5). Для составных единиц, если во входном значении интервала недостаточно компонентов, значение старшей единицы устанавливается в 0. Знак этого значения определяется исключительно тем, является ли первый нецифровой символ знаком `-`. |
| `<time_unit>` | Допустимые значения: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND, YEAR_MONTH, DAY_HOUR, DAY_MINUTE, DAY_SECOND, DAY_MICROSECOND, HOUR_MINUTE, HOUR_SECOND, HOUR_MICROSECOND, MINUTE_SECOND, MINUTE_MICROSECOND, SECOND_MICROSECOND |

| time_unit          | Ожидаемый формат (разделителями могут служить любые нецифровые символы) |
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

Для входного значения типа `TIMESTAMP_NS` возвращается значение типа `TIMESTAMP_NS` с фиксированной точностью до девяти знаков в дробной части секунды. Результаты проверяются на соответствие диапазону возвращаемого типа; для `TIMESTAMP_NS` используется диапазон `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

Возвращает вычисленный результат того же типа, что и date:
- Если входное значение имеет тип DATE, возвращается DATE (только дата);
- Если входное значение имеет тип DATETIME, возвращается DATETIME (дата и время).
- Если входное значение имеет тип TIMESTAMP_NS, возвращается TIMESTAMP_NS с девятью знаками в дробной части секунды.
- Если входное значение имеет тип TIMESTAMPTZ, возвращается TIMESTAMPTZ (дата, время и смещение часового пояса).
- Для типов даты и времени с заданной точностью дробной части эта точность сохраняется в возвращаемом значении.

Особые случаи:
- Если какой-либо параметр равен NULL, возвращается NULL;
- При недопустимом значении expr (отрицательные значения) или time_unit возвращается NULL;
- Для составных единиц, если во входном значении слишком много компонентов или значение любого компонента превышает допустимый максимум 922337203685477579, возвращается ошибка.
- Если вычисленный результат предшествует минимальному значению, поддерживаемому типом даты (например, дате '0000-01-01'), возвращается ошибка.

## Примеры {#examples}

```sql
-- Subtract two days
mysql> select date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------------------------+
| date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY) |
+-------------------------------------------------------------------+
| 2010-11-28 23:59:59                                               |
+-------------------------------------------------------------------+

-- Parameter with scale, return preserves scale
mysql> select date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND);
+------------------------------------------------------+
| date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND) |
+------------------------------------------------------+
| 2010-11-30 23:59:55.6                                |
+------------------------------------------------------+

-- Subtract two months across years
mysql> select date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH);
+--------------------------------------------------------+
| date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH) |
+--------------------------------------------------------+
| 2022-11-15                                             |
+--------------------------------------------------------+

-- February 2023 has only 28 days, so subtracting one month from 2023-03-31 results in 2023-02-28
mysql> select date_sub('2023-03-31', INTERVAL 1 MONTH);
+------------------------------------------+
| date_sub('2023-03-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

-- Subtract 61 seconds
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND);
+-----------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND) |
+-----------------------------------------------------+
| 2023-12-31 23:58:58                                 |
+-----------------------------------------------------+

-- Subtract quarters
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER);
+------------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER) |
+------------------------------------------------------+
| 2008-09-30 23:59:59                                  |
+------------------------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT DATE_SUB('2024-02-05 02:03:04.123+12:00', INTERVAL 1 DAY);
+-----------------------------------------------------------+
| DATE_SUB('2024-02-05 02:03:04.123+12:00', INTERVAL 1 DAY) |
+-----------------------------------------------------------+
| 2024-02-03 22:03:04.123+08:00                             |
+-----------------------------------------------------------+

-- Any parameter is NULL
mysql> select date_sub('2023-01-01', INTERVAL NULL DAY);
+-------------------------------------------+
| date_sub('2023-01-01', INTERVAL NULL DAY) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+


-- For compound units, accept all non-numeric characters as separators.
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR);
+----------------------------------------------------------------+
| DATE_SUB('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR) |
+----------------------------------------------------------------+
| 2025-10-22 08:10:10                                            |
+----------------------------------------------------------------+

-- For composite units, the sign of the time interval is determined only by whether the first non-digit character is `-`
-- All subsequent `-` are considered part of the delimiter
select 
    DATE_SUB('2025-10-23 10:10:10', INTERVAL '#-1:-1' MINUTE_SECOND) AS first_not_sub,
    DATE_SUB('2025-10-23 10:10:10', INTERVAL '  -1:1' MINUTE_SECOND) AS first_sub;
+---------------------+---------------------+
| first_not_sub       | first_sub           |
+---------------------+---------------------+
| 2025-10-23 10:09:09 | 2025-10-23 10:11:11 |
+---------------------+---------------------+

-- For composite units, if the input time interval is too short, the value of the larger unit will be set to 0.
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '1' MINUTE_SECOND) AS minute_interval_is_zero
+-------------------------+
| minute_interval_is_zero |
+-------------------------+
| 2025-10-23 10:10:09     |
+-------------------------+

-- If the number of time intervals input is excessive, return an error
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '1:2:3.4' SECOND_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation second_microsecond_add of -1:2:3.4 is invalid

-- For composite units, if the value of any part exceeds the maximum value of 922337203685477580
-- return an error
select DATE_SUB('2025-10-10 1:2:3', INTERVAL '922337203685477580' DAY_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_microsecond_add of 2025-10-10 01:02:03, -922337203685477580 out of range


-- Exceeds minimum date
mysql> select date_sub('0000-01-01', INTERVAL 1 DAY);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_add of 0000-01-01, -1 out of range

select date_sub('9999-01-01', INTERVAL -1 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 9999-01-01, 1 out of range
```
