---
{
    "title": "MINUTES_SUB",
    "language": "ru",
    "description": "Функция MINUTESSUB вычитает указанное количество минут из входного значения даты и времени и возвращает полученное новое значение даты и времени."
}
---

## Описание {#description}

Функция MINUTES_SUB вычитает указанное количество минут из входного значения даты и времени и возвращает полученное новое значение даты и времени. Эта функция поддерживает обработку типов DATE, DATETIME и TIMESTAMPTZ.

Эта функция работает так же, как [функция date_sub](./date-sub) и [функция date_sub](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) в MySQL при использовании MINUTE в качестве единицы измерения.

## Синтаксис {#syntax}

```sql
MINUTES_SUB(`<date_or_time_expr>`, `<minutes>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Входное значение даты и времени типа DATE, DATETIME или TIMESTAMPTZ. Подробнее о форматах даты и времени см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<minutes>` | Количество минут для вычитания, тип BIGINT. Может быть положительным или отрицательным. |

## Возвращаемое значение {#return-value}

Возвращает результат вычитания указанного количества минут `<minutes>` из исходного времени `<datetime_like_type>`. Тип возвращаемого значения зависит от типа первого параметра:

- Если первый параметр имеет тип TIMESTAMPTZ, возвращает TIMESTAMPTZ.
- Если первый параметр имеет тип DATETIME, возвращает DATETIME.

Особые случаи:

- Если `<minutes>` имеет отрицательное значение, функция работает так же, как при добавлении соответствующего количества минут к исходному времени (т. е. MINUTES_SUB(date, -n) эквивалентно MINUTES_ADD(date, n)).
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если входное значение даты и времени содержит микросекунды, исходная точность до микросекунд сохраняется после вычитания минут (например, '2023-01-01 00:01:00.123456' превращается в '2023-01-01 00:00:00.123456' после вычитания 1 минуты).
- Если результат вычисления выходит за допустимый диапазон типа DATETIME (от 0000-01-01 00:00:00 до 9999-12-31 23:59:59.999999), возникает исключение.
- Если любой из параметров равен NULL, возвращает NULL.

## Примеры {#examples}

```sql
-- Subtract minutes from DATETIME
SELECT MINUTES_SUB('2020-02-02 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 02:01:02 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_SUB('2023-07-13 22:38:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to addition)
SELECT MINUTES_SUB('2023-07-13 22:23:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:18 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_SUB('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-12 23:30:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MINUTES_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| MINUTES_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:21:33.123+08:00                   |
+-------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_SUB(NULL, 10), MINUTES_SUB('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| MINUTES_SUB(NULL, 10) | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_add of 0000-01-01 00:00:00, -1 out of range
```
