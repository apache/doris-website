---
{
    "title": "EXTRACT",
    "language": "ru",
    "description": "Функция EXTRACT используется для извлечения отдельных компонентов из значений даты или времени, таких как год, месяц, неделя, день, час, минута, секунда и т. д."
}
---

## Описание {#description}

Функция `EXTRACT` используется для извлечения отдельных компонентов из значений даты или времени, таких как год, месяц, неделя, день, час, минута, секунда и т. д. Эта функция позволяет точно получить нужную часть значения даты и времени.

Поведение этой функции соответствует поведению [функции extract](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_extract) в MySQL.

## Синтаксис {#syntax}

`EXTRACT(<unit> FROM <date_or_time_expr>)`

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<unit>` | Значения перечисления: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND, YEAR_MONTH, DAY_HOUR, DAY_MINUTE, DAY_SECOND, DAY_MICROSECOND, HOUR_MINUTE, HOUR_SECOND, HOUR_MICROSECOND, MINUTE_SECOND, MINUTE_MICROSECOND, SECOND_MICROSECOND, DAYOFWEEK(DOW), DAYOFYEAR(DOY) |
| `<datetime_or_time_expr>` | Корректное выражение даты, поддерживающее типы date/datetime и строки в формате даты и времени. Подробнее о форматах datetime и date см. в разделах [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает извлечённый компонент даты или времени.
- Для отдельных единиц, таких как `YEAR`, [DAYOFWEEK(DOW)](./dayofweek.md) и [DAYOFYEAR(DOY)](./dayofyear.md), возвращаемый тип: INT
- Для составных единиц, таких как `YEAR_MONTH`, возвращаемый тип: STRING

Диапазон значений для единицы «неделя» составляет 0-53. Номер недели вычисляется следующим образом:

- Воскресенье считается первым днём недели.
- Неделя, содержащая первое воскресенье года, считается неделей 1.
- Даты до первого воскресенья относятся к неделе 0.

Если в качестве единицы указаны год, месяц, день, час, минута, секунда или микросекунда, возвращается значение соответствующего компонента даты и времени.

Если в качестве единицы указан квартал, для января–марта возвращается 1, для апреля–июня возвращается 2, для июля–сентября возвращается 3, для октября–декабря возвращается 4.

Особые случаи:
- Если <date_or_time_expr> имеет значение NULL, возвращается NULL.
- Если <unit> содержит неподдерживаемую единицу, выдаётся ошибка.

Формат возвращаемого значения для составных единиц:
| Единица времени    | Формат возвращаемого значения             |
| ------------------ | ----------------------------------------- |
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

## Примеры {#examples}

```sql
-- Extract year, month, day, hour, minute, second, microsecond time components from datetime
select extract(year from '2022-09-22 17:01:30') as year,
extract(month from '2022-09-22 17:01:30') as month,
extract(day from '2022-09-22 17:01:30') as day,
extract(hour from '2022-09-22 17:01:30') as hour,
extract(minute from '2022-09-22 17:01:30') as minute,
extract(second from '2022-09-22 17:01:30') as second,
extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetime(6))) as microsecond;

+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+

-- Extract quarter from datetime
mysql> select extract(quarter from '2023-05-15') as quarter;
+---------+
| quarter |
+---------+
|       2 |
+---------+

-- Extract week number for the corresponding date. Since the first Sunday of 2024 is on January 7th, all dates before 01-07 return 0
select extract(week from '2024-01-06') as week;
+------+
| week |
+------+
|    0 |
+------+

-- January 7th is the first Sunday, returns 1
select extract(week from '2024-01-07') as week;
+------+
| week |
+------+
|    1 |
+------+

-- Under this rule, 2024 only has weeks 0-52
select extract(week from '2024-12-31') as week;
+------+
| week |
+------+
|   52 |
+------+

select extract(year_month from '2026-01-01 11:45:14.123456') as year_month,
       extract(day_hour from '2026-01-01 11:45:14.123456') as day_hour,
       extract(day_minute from '2026-01-01 11:45:14.123456') as day_minute,
       extract(day_second from '2026-01-01 11:45:14.123456') as day_second,
       extract(day_microsecond from '2026-01-01 11:45:14.123456') as day_microsecond,
       extract(hour_minute from '2026-01-01 11:45:14.123456') as hour_minute,
       extract(hour_second from '2026-01-01 11:45:14.123456') as hour_second,
       extract(hour_microsecond from '2026-01-01 11:45:14.123456') as hour_microsecond,
       extract(minute_second from '2026-01-01 11:45:14.123456') as minute_second,
       extract(minute_microsecond from '2026-01-01 11:45:14.123456') as minute_microsecond,
       extract(second_microsecond from '2026-01-01 11:45:14.123456') as second_microsecond;

+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+
| year_month | day_hour | day_minute | day_second  | day_microsecond    | hour_minute | hour_second | hour_microsecond | minute_second | minute_microsecond | second_microsecond |
+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+
| 2026-01    | 01 11    | 01 11:45   | 01 11:45:14 | 01 11:45:14.123456 | 11:45       | 11:45:14    | 11:45:14.123456  | 45:14         | 45:14.123456       | 14.123456          |
+------------+----------+------------+-------------+--------------------+-------------+-------------+------------------+---------------+--------------------+--------------------+

-- Input unit does not exist, reports error
select extract(uint from '2024-01-07') as week;

ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'uint'
```
