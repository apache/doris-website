---
{
    "title": "WEEKS_ADD",
    "language": "ru",
    "description": "Функция WEEKSADD позволяет прибавить указанное количество недель к заданному значению даты или времени или вычесть его."
}
---

## Описание {#description}

Функция WEEKS_ADD позволяет прибавить указанное количество недель к заданному значению даты или времени или вычесть его и возвращает скорректированную дату или время. Это эквивалентно смещению исходной даты на семь дней вперёд или назад. Функция поддерживает входные значения типов DATE, DATETIME и TIMESTAMPTZ.

Поведение этой функции соответствует поведению [функции weeks_add](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-add) с единицей измерения WEEK в MySQL.

## Синтаксис {#syntax}
```sql
WEEKS_ADD(`<datetime_or_date_expr>`, `<weeks_value>`)
```

## Параметры {#parameters}
| Параметр | Описание |
|-----------|-------------|
| `<datetime_or_date_expr>` | Входное значение даты и времени, поддерживаются типы date/datetime/timestamptz. Подробную информацию о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<weeks_value>` | Целое число типа INT, задающее количество недель для прибавления или вычитания (положительное для прибавления, отрицательное для вычитания) |

## Возвращаемое значение {#return-value}

Возвращает дату и время с прибавленным указанным количеством недель. Тип возвращаемого значения определяется типом первого параметра:

- Если входное значение имеет тип DATE, возвращаемое значение имеет тип DATE (изменяются только год, месяц и день).
- Если входное значение имеет тип DATETIME, возвращаемое значение имеет тип DATETIME (год, месяц и день изменяются, а часы, минуты и секунды остаются без изменений).
- Если входное значение имеет тип TIMESTAMPTZ, возвращаемое значение имеет тип TIMESTAMPTZ (включает дату, время и смещение часового пояса).

Особые случаи:
- Отрицательное значение `<weeks_value>` означает вычитание недель.
- Если любой из входных параметров равен NULL, возвращается NULL.
- Если результат вычисления выходит за допустимый диапазон типа даты (от 0000-01-01 00:00:00 до 9999-12-31 23:59:59), возвращается ошибка.

## Примеры {#examples}
```sql
-- DATETIME type add 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_ADD('2023-10-01 08:30:45', 1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-08 08:30:45 |
+---------------------+

-- DATETIME type subtract 1 week (negative weeks, cross-month)
SELECT WEEKS_ADD('2023-10-01 14:20:10', -1) AS subtract_1_week_datetime;
+--------------------------+
| subtract_1_week_datetime |
+--------------------------+
| 2023-09-24 14:20:10      |
+--------------------------+

-- DATE type add 2 weeks (only adjust date, no time portion)
SELECT WEEKS_ADD('2023-05-20', 2) AS add_2_week_date;
+-----------------+
| add_2_week_date |
+-----------------+
| 2023-06-03      |
+-----------------+

-- Cross-year addition (late December plus 1 week, to early January next year)
SELECT WEEKS_ADD('2023-12-25', 1) AS cross_year_add;
+----------------+
| cross_year_add |
+----------------+
| 2024-01-01     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-17 12:22:33.123+08:00                 |
+-----------------------------------------------+
```
