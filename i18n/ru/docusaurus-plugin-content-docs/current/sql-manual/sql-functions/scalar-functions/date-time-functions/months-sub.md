---
{
    "title": "MONTHS_SUB",
    "language": "ru",
    "description": "Вычитает указанное количество месяцев из значения типа DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ, сохраняя его тип даты и времени."
}
---

## Описание {#description}

Функция MONTHS_SUB вычитает указанное количество месяцев из входного значения даты и времени и возвращает полученное новое значение даты и времени. Функция поддерживает типы DATE, DATETIME, TIMESTAMP_NS и TIMESTAMPTZ. Если передано отрицательное число, операция эквивалентна прибавлению соответствующего количества месяцев.

При использовании MONTH в качестве единицы измерения поведение этой функции совпадает с поведением [функции date_sub](./date-sub) и [функции date_sub](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_sub) в MySQL.

## Синтаксис {#syntax}

```sql
MONTHS_SUB(`<date_or_time_expr>`, `<nums>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Значение даты, из которого вычитаются месяцы. Поддерживаются типы DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ. Сведения о конкретных форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<nums>` | Количество вычитаемых месяцев, тип INT. Положительные числа означают вычитание nums месяцев из значения даты и времени, отрицательные числа означают прибавление nums месяцев. |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа, что и входное `<date_or_time_expr>` (DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ), представляющее результат вычитания указанного количества месяцев из исходного значения даты и времени.

- Если `<nums>` отрицательно, функция работает так же, как прибавление соответствующего количества месяцев к исходному значению даты и времени (то есть MONTHS_SUB(date, -n) эквивалентно MONTHS_ADD(date, n)).
- Если входная дата приходится на последний день месяца, а в целевом месяце меньше дней, чем номер этого дня, дата автоматически корректируется до последнего дня целевого месяца (например, 31 марта минус 1 месяц даёт 28 или 29 февраля в зависимости от того, високосный ли год).
- Если результат вычисления выходит за допустимый диапазон типа даты (тип DATE: от 0000-01-01 до 9999-12-31; тип DATETIME: от 0000-01-01 00:00:00 до 9999-12-31 23:59:59), возвращается ошибка.
- Если любой из параметров равен NULL, возвращается NULL.

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
