---
{
    "title": "MONTHS_SUB",
    "language": "ru",
    "description": "Функция MONTHSSUB вычитает указанное количество месяцев из входного значения даты и времени и возвращает полученное новое значение даты и времени."
}
---

## Описание {#description}

Функция MONTHS_SUB вычитает указанное количество месяцев из входного значения даты и времени и возвращает полученное новое значение даты и времени. Эта функция поддерживает типы DATE, DATETIME и TIMESTAMPTZ. Если передано отрицательное число, операция эквивалентна прибавлению соответствующего количества месяцев.

Поведение этой функции совпадает с поведением [функции date_sub](./date-sub) и [функции date_sub в MySQL](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_sub) при использовании MONTH в качестве единицы измерения.

## Синтаксис {#syntax}

```sql
MONTHS_SUB(`<date_or_time_expr>`, `<nums>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Значение даты, из которого нужно вычесть месяцы. Поддерживаются типы date/datetime/timestamptz. Подробнее о форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<nums>` | Количество месяцев для вычитания, тип INT. Положительные числа означают вычитание nums месяцев из значения даты и времени, отрицательные — прибавление nums месяцев. |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа, что и входной параметр `<date_or_time_expr>` (DATE, DATETIME или TIMESTAMPTZ), представляющее результат вычитания указанного количества месяцев из исходного значения даты и времени.

- Если `<nums>` отрицателен, функция действует так же, как прибавление соответствующего количества месяцев к исходному значению даты и времени (то есть MONTHS_SUB(date, -n) эквивалентно MONTHS_ADD(date, n)).
- Если входная дата приходится на последний день месяца, а в целевом месяце меньше дней, чем номер дня в исходной дате, результат автоматически корректируется до последнего дня целевого месяца (например, если из 31 марта вычесть 1 месяц, получится 28 или 29 февраля в зависимости от того, является ли год високосным).
- Если результат вычисления выходит за допустимый диапазон типа даты (тип DATE: от 0000-01-01 до 9999-12-31; тип DATETIME: от 0000-01-01 00:00:00 до 9999-12-31 23:59:59), возвращается ошибка.
- Если какой-либо параметр равен NULL, возвращается NULL.

## Примеры {#examples}

```sql
--- Subtract months from DATE type
SELECT MONTHS_SUB('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2019-12-31 |
+------------+

--- Subtract months from DATETIME type (preserves time component)
SELECT MONTHS_SUB('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2019-12-31 02:02:02 |
+---------------------+

--- Negative months (equivalent to addition)
SELECT MONTHS_SUB('2020-01-31', -1) AS result;
+------------+
| result     |
+------------+
| 2020-02-29 |
+------------+

--- Non-end-of-month date subtracting months (direct decrement)
SELECT MONTHS_SUB('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-02-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT MONTHS_SUB('2023-10-13 22:28:18.456789', 3) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

--- Returns NULL when input is NULL
SELECT MONTHS_SUB(NULL, 5), MONTHS_SUB('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_sub(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

--- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MONTHS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+------------------------------------------------+
| MONTHS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+------------------------------------------------+
| 2025-09-10 12:22:33.123+08:00                  |
+------------------------------------------------+

--- Calculation result exceeds date range
mysql> SELECT MONTHS_SUB('0000-01-01', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 0000-01-01, -1 out of range

mysql> SELECT MONTHS_SUB('9999-12-31', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 9999-12-31, 1 out of range
```
