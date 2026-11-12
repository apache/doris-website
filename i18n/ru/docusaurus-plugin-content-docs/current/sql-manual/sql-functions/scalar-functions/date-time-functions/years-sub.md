---
{
    "title": "YEARS_SUB",
    "language": "ru",
    "description": "Функция YEARSSUB вычитает указанное количество лет из заданного значения даты или времени (или прибавляет его к этому значению),"
}
---

## Описание {#description}

Функция YEARS_SUB вычитает указанное количество лет из заданного значения даты или времени (или прибавляет его к этому значению) и возвращает скорректированную дату или время (по сути, вычитает years_value × 1 год). Она поддерживает обработку типов DATE, DATETIME и TIMESTAMP_NS, при этом количество лет может быть положительным (вычитание) или отрицательным (прибавление). Функция принимает входные значения типов DATE, DATETIME, TIMESTAMP_NS и TIMESTAMPTZ.

Поведение этой функции соответствует поведению [функции date_sub](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) с единицей измерения YEAR в MySQL.

## Синтаксис {#syntax}

```sql
YEARS_SUB(`<date_or_time_expr>`, `<years>`)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Входное значение даты и времени; поддерживаются типы DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ. Подробнее о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)  |
| `<years>` | Количество лет для вычитания, тип INT. Положительные числа означают вычитание, отрицательные — прибавление |

## Возвращаемое значение {#return-value}

При входном значении типа `TIMESTAMP_NS` возвращается значение типа `TIMESTAMP_NS` с фиксированной точностью до девяти знаков в дробной части секунды. Результаты проверяются на соответствие диапазону возвращаемого типа; для `TIMESTAMP_NS` используется диапазон `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

Возвращается результат того же типа, что и входное значение (DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ), представляющий скорректированную дату или время. Тип возвращаемого значения определяется типом первого параметра:

- Если входное значение имеет тип DATE, возвращается значение типа DATE (корректируются только год, месяц и день).
- Если входное значение имеет тип DATETIME, возвращается значение типа DATETIME (год, месяц и день корректируются, а часы, минуты и секунды остаются без изменений).
- Если входное значение имеет тип TIMESTAMPTZ, возвращается значение типа TIMESTAMPTZ (включает дату, время и смещение часового пояса).
- Отрицательное значение `<years_value>` означает прибавление лет (эквивалентно YEARS_ADD(`<datetime_or_date_value>`, `<years_value>`)).
- Если любой из входных параметров равен NULL, возвращается NULL.
- Если результат вычисления выходит за допустимый диапазон типа даты (от 0000-01-01 00:00:00 до 9999-12-31 23:59:59), возвращается ошибка.
- Если в скорректированном месяце недостаточно дней (например, при вычитании 1 года из 29 февраля високосного года получается 28 февраля невисокосного года), дата автоматически корректируется с учётом фактического количества дней в этом месяце.

## Примеры {#examples}

```sql
-- DATETIME type subtract 1 year (basic functionality, hours, minutes, seconds remain unchanged)
SELECT YEARS_SUB('2020-02-02 02:02:02', 1) AS sub_1_year_datetime;
+---------------------+
| sub_1_year_datetime |
+---------------------+
| 2019-02-02 02:02:02 |
+---------------------+

-- DATETIME type add 1 year (negative years_value, cross-year)
SELECT YEARS_SUB('2022-05-10 15:40:20', -1) AS add_1_year_datetime;
+---------------------+
| add_1_year_datetime |
+---------------------+
| 2023-05-10 15:40:20 |
+---------------------+

-- DATE type subtract 3 years (only adjust date)
SELECT YEARS_SUB('2022-12-25', 3) AS sub_3_year_date;
+-----------------+
| sub_3_year_date |
+-----------------+
| 2019-12-25      |
+-----------------+

-- Leap day handling (from leap year February 29th subtract 1 year to non-leap year February 28th)
SELECT YEARS_SUB('2020-02-29', 1) AS leap_day_adjust_1;
+-------------------+
| leap_day_adjust_1 |
+-------------------+
| 2019-02-28        |
+-------------------+

-- Input is NULL (returns NULL)
SELECT YEARS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT YEARS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| YEARS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2024-10-10 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_sub of 9999-12-31, 1 out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_sub of 0000-01-01, -1 out of range
```
