---
{
    "title": "YEARS_ADD",
    "language": "ru",
    "description": "Функция YEARSADD прибавляет к заданному значению даты или времени указанное число лет (или вычитает его), возвращая скорректированную дату или время."
}
---

## Описание {#description}

Функция YEARS_ADD прибавляет к заданному значению даты или времени указанное число лет (или вычитает его), возвращая скорректированную дату или время. Она поддерживает обработку типов DATE и DATETIME, при этом число лет может быть положительным (прибавление) или отрицательным (вычитание). Функция поддерживает входные значения типов DATE, DATETIME и TIMESTAMPTZ.

Эта функция соответствует [функции date_add](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) с единицей измерения YEAR в MySQL.

## Синтаксис {#syntax}

```sql
YEARS_ADD(`<date_or_time_expr>`, `<years>`)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Входное значение даты и времени; поддерживаются типы date/datetime/timestamptz. Подробнее о форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<years>` | Число лет для прибавления, тип INT. Отрицательные числа означают вычитание, положительные — прибавление |


## Возвращаемое значение {#return-value}

Возвращает результат того же типа, что и входное значение (DATE, DATETIME или TIMESTAMPTZ), представляющий скорректированную дату или время. Тип возвращаемого значения определяется типом первого параметра:

- Если входное значение имеет тип DATE, возвращается значение типа DATE (изменяются только год, месяц и день).
- Если входное значение имеет тип DATETIME, возвращается значение типа DATETIME (год, месяц и день изменяются, а часы, минуты и секунды остаются без изменений).
- Если входное значение имеет тип TIMESTAMPTZ, возвращается значение типа TIMESTAMPTZ (включает дату, время и смещение часового пояса).
- Отрицательное значение `<years_value>` означает вычитание лет (эквивалентно YEARS_SUB(`<datetime_or_date_value>`, `<years_value>`)).
- Если хотя бы один входной параметр равен NULL, возвращается NULL.
- Если результат вычисления выходит за допустимый диапазон типа даты (от 0000-01-01 00:00:00 до 9999-12-31 23:59:59), возвращается ошибка.
- Если в месяце после изменения даты недостаточно дней (например, к 29 февраля прибавляется 1 год, а следующий год невисокосный), дата автоматически корректируется до последнего дня этого месяца (например, 2020-02-29 плюс 1 год даёт 2021-02-28).

## Примеры {#examples}

```sql
-- DATETIME type add 1 year (basic functionality, hours, minutes, seconds remain unchanged)
SELECT YEARS_ADD('2020-01-31 02:02:02', 1) AS add_1_year_datetime;
+-----------------------+
| add_1_year_datetime   |
+-----------------------+
| 2021-01-31 02:02:02   |
+-----------------------+

-- DATETIME type subtract 1 year (negative years_value, cross-year)
SELECT YEARS_ADD('2023-05-10 15:40:20', -1) AS subtract_1_year_datetime;
+--------------------------+
| subtract_1_year_datetime |
+--------------------------+
| 2022-05-10 15:40:20      |
+--------------------------+

-- DATE type add 3 years (only adjust date)
SELECT YEARS_ADD('2019-12-25', 3) AS add_3_year_date;
+------------------+
| add_3_year_date  |
+------------------+
| 2022-12-25       |
+------------------+

-- Leap day handling (2020-02-29 add 1 year, next year is not leap year)
SELECT YEARS_ADD('2020-02-29', 1) AS leap_day_adjust;
+------------------+
| leap_day_adjust  |
+------------------+
| 2021-02-28       |
+------------------+

-- Cross-month day adjustment (January 31st add 1 year to February)
SELECT YEARS_ADD('2023-01-31', 1) AS month_day_adjust;
+------------------+
| month_day_adjust |
+------------------+
| 2024-01-31       |  -- 2024 January has 31 days, no adjustment needed
+------------------+

-- Input is NULL (returns NULL)
SELECT YEARS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT YEARS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| YEARS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2026-10-10 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_ADD('9999-12-31', 1);
-- ERROR: Operation out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_ADD('0000-01-01', -1);
-- ERROR: Operation out of range
```
