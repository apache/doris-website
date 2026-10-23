---
{
    "title": "MONTHS_ADD",
    "language": "ru",
    "description": "Добавляет указанное количество месяцев к значению DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ и сохраняет его тип данных."
}
---

## Описание {#description}

Функция MONTHS_ADD добавляет указанное количество месяцев к входному значению даты и времени и возвращает полученное новое значение даты и времени. Функция поддерживает типы DATE, DATETIME, TIMESTAMP_NS и TIMESTAMPTZ. Если передано отрицательное число, это эквивалентно вычитанию соответствующего количества месяцев.

Поведение этой функции соответствует [функции date_add](./date-add) и [функции date_add](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) в MySQL при использовании MONTH в качестве единицы измерения.

## Синтаксис {#syntax}

```sql
MONTHS_ADD(`<date_or_time_expr>`, `<nums>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Входное значение даты и времени. Поддерживаются типы DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ. Подробнее о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<nums>` | Количество месяцев для прибавления или вычитания, тип INT. Отрицательные числа означают вычитание nums месяцев из значения даты и времени, а положительные означают прибавление nums месяцев. |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа, что и входное значение `<date_or_time_expr>` (DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ), представляющее результат прибавления указанного количества месяцев к исходному значению даты и времени.

- Если `<nums>` отрицательно, функция работает так же, как вычитание соответствующего количества месяцев из исходного значения даты и времени (т. е. MONTHS_ADD(date, -n) эквивалентно MONTHS_SUB(date, n)).
- Если входная дата приходится на последний день месяца, а в целевом месяце меньше дней, чем номер дня во входной дате, результат автоматически корректируется до последнего дня целевого месяца (например, 31 января плюс 1 месяц даёт 28 или 29 февраля в зависимости от того, является ли год високосным).
- Если результат вычисления выходит за допустимый диапазон типа даты (тип DATE: от 0000-01-01 до 9999-12-31; тип DATETIME: от 0000-01-01 00:00:00 до 9999-12-31 23:59:59), возвращается ошибка.
- Если любой из параметров равен NULL, возвращается NULL.

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
