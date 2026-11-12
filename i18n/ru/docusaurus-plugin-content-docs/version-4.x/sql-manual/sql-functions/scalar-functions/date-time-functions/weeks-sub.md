---
{
    "title": "WEEKS_SUB",
    "language": "ru",
    "description": "Функция WEEKSSUB используется для вычитания заданного количества недель из указанного значения даты или времени (или прибавления к нему этого количества недель),"
}
---

## Описание {#description}
Функция WEEKS_SUB вычитает заданное количество недель из указанного значения даты или времени (или прибавляет к нему это количество недель) и возвращает скорректированную дату или время (по сути, вычитая weeks_value × 7 дней). Поддерживается обработка типов DATE, DATETIME и TIMESTAMPTZ.

Поведение этой функции соответствует поведению [функции weeks_sub](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-sub) с единицей измерения WEEK в MySQL.

## Синтаксис {#syntax}
```sql
WEEKS_SUB(`<date_or_time_expr>`, `<week_period>`)
```

## Параметры {#parameters}
| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Входное значение даты и времени; поддерживаются типы date/datetime/timestamptz. Сведения о конкретных форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `week_period` | Целое число типа INT, задающее количество недель для вычитания (положительное значение означает вычитание, отрицательное — прибавление). |

## Возвращаемое значение {#return-value}
Возвращает дату или время после вычитания указанного количества недель. Тип возвращаемого значения определяется типом первого параметра:

- Если входное значение имеет тип DATE, возвращаемое значение имеет тип DATE (изменяются только год, месяц и день).
- Если входное значение имеет тип DATETIME, возвращаемое значение имеет тип DATETIME (год, месяц и день изменяются, а часы, минуты и секунды остаются без изменений).
- Если входное значение имеет тип TIMESTAMPTZ, возвращаемое значение имеет тип TIMESTAMPTZ (включает дату, время и смещение часового пояса).

Особые случаи:
- Отрицательное значение `<weeks_value>` означает прибавление недель (эквивалентно WEEKS_ADD(`<datetime_or_date_value>`, `<weeks_value>`)).
- Если хотя бы один входной параметр равен NULL, возвращается NULL.
- Если результат вычисления выходит за допустимый диапазон типа даты (от 0000-01-01 00:00:00 до 9999-12-31 23:59:59), возвращается ошибка.
  
## Примеры {#examples}
```sql
-- DATETIME type subtract 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_SUB('2023-10-01 08:30:45', 1) AS sub_1_week_datetime;
+---------------------+
| sub_1_week_datetime |
+---------------------+
| 2023-09-24 08:30:45 |
+---------------------+

-- DATETIME type add 1 week (negative weeks_value, cross-month)
SELECT WEEKS_SUB('2023-09-24 14:20:10', -1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-01 14:20:10 |
+---------------------+

-- DATE type subtract 2 weeks (only adjust date, no time portion)
SELECT WEEKS_SUB('2023-06-03', 2) AS sub_2_week_date;
+-----------------+
| sub_2_week_date |
+-----------------+
| 2023-05-20      |
+-----------------+

-- Cross-year subtraction (early January minus 1 week, to late December of previous year)
SELECT WEEKS_SUB('2024-01-01', 1) AS cross_year_sub;
+----------------+
| cross_year_sub |
+----------------+
| 2023-12-25     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT WEEKS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-03 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- The calculation result exceeds the lower bound of the datetime range.
SELECT WEEKS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_sub of 0000-01-01, -1 out of range

-- The calculation result exceeds the upper bound of the datetime range.
SELECT WEEKS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_sub of 9999-12-31, 1 out of range
```
