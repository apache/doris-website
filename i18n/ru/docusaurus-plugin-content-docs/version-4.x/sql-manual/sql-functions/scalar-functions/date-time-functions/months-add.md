---
{
    "title": "MONTHS_ADD",
    "language": "ru",
    "description": "Функция MONTHSADD добавляет указанное количество месяцев к входному значению даты и времени и возвращает полученное значение даты и времени."
}
---

## Описание {#description}

Функция MONTHS_ADD добавляет указанное количество месяцев к входному значению даты и времени и возвращает полученное значение даты и времени. Функция поддерживает типы DATE, DATETIME и TIMESTAMPTZ. Если передано отрицательное число, это равносильно вычитанию соответствующего количества месяцев.

Поведение этой функции соответствует поведению [функции date_add](./date-add) и [функции date_add](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) в MySQL, когда в качестве единицы используется MONTH.

## Синтаксис {#syntax}

```sql
MONTHS_ADD(`<date_or_time_expr>`, `<nums>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Входное значение даты и времени. Поддерживаются типы date/datetime/timestamptz. Подробные сведения о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<nums>` | Количество месяцев для добавления или вычитания, тип INT. Отрицательные числа означают вычитание nums месяцев из значения даты и времени, положительные числа означают добавление nums месяцев. |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа, что и входное значение `<date_or_time_expr>` (DATE, DATETIME или TIMESTAMPTZ), представляющее результат добавления указанного количества месяцев к исходной дате и времени.

- Если `<nums>` отрицательно, функция выполняет вычитание соответствующего количества месяцев из исходной даты и времени (то есть MONTHS_ADD(date, -n) равносильно MONTHS_SUB(date, n)).
- Если входная дата приходится на последний день месяца, а в целевом месяце меньше дней, чем номер дня в исходной дате, результат автоматически корректируется до последнего дня целевого месяца (например, добавление к 31 января 1 месяца даёт 28 или 29 февраля в зависимости от того, високосный ли год).
- Если результат вычисления выходит за допустимый диапазон типа даты (тип DATE: от 0000-01-01 до 9999-12-31; тип DATETIME: от 0000-01-01 00:00:00 до 9999-12-31 23:59:59), возвращается ошибка.
- Если какой-либо параметр равен NULL, возвращается NULL.

## Примеры {#examples}

```sql
-- Add months to DATE type
SELECT MONTHS_ADD('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2020-02-29 |
+------------+

-- Add months to DATETIME type (preserves time component)
SELECT MONTHS_ADD('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-29 02:02:02 |
+---------------------+

-- Negative months (equivalent to subtraction)
SELECT MONTHS_ADD('2020-01-31', -1) AS result;
+------------+
| result     |
+------------+
| 2019-12-31 |
+------------+

-- Non-end-of-month date adding months (direct accumulation)
SELECT MONTHS_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-12-13 22:28:18 |
+---------------------+

-- DATETIME with microseconds (preserves precision)
SELECT MONTHS_ADD('2023-07-13 22:28:18.456789', 3) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-13 22:28:18.456789 |
+----------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MONTHS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+------------------------------------------------+
| MONTHS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+------------------------------------------------+
| 2025-11-10 12:22:33.123+08:00                  |
+------------------------------------------------+

-- Returns NULL when input is NULL
SELECT MONTHS_ADD(NULL, 5), MONTHS_ADD('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_add(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

-- Calculation result exceeds date range
SELECT MONTHS_ADD('9999-12-31', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 9999-12-31, 1 out of range

SELECT MONTHS_ADD('0000-01-01', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 0000-01-01, -1 out of range
```
