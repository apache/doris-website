---
{
    "title": "MINUTES_ADD",
    "language": "ru",
    "description": "Функция MINUTESADD прибавляет указанное количество минут к входному значению даты и времени и возвращает полученное новое значение даты и времени."
}
---

## Описание {#description}

Функция MINUTES_ADD прибавляет указанное количество минут к входному значению даты и времени и возвращает полученное новое значение даты и времени. Функция поддерживает типы DATE, DATETIME и TIMESTAMPTZ.

Поведение этой функции соответствует поведению [функции date_add](./date-add) и [функции date_add в MySQL](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) при использовании MINUTE в качестве единицы измерения.

## Синтаксис {#syntax}

```sql
MINUTES_ADD(`<date_or_time_expr>`, `<minutes>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Входное значение даты и времени типа DATE, DATETIME или TIMESTAMPTZ. Подробнее о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<minutes>` | Количество минут для прибавления, тип BIGINT. |

## Возвращаемое значение {#return-value}

Возвращает результат прибавления указанного количества минут `<minutes>` к исходному времени `<datetime_like_type>`. Тип возвращаемого значения зависит от типа первого параметра:
- Если первый параметр имеет тип TIMESTAMPTZ, возвращается TIMESTAMPTZ.
- Если первый параметр имеет тип DATETIME, возвращается DATETIME.

Особые случаи:
- Если значение `<minutes>` отрицательное, функция выполняет вычитание соответствующего количества минут из исходного времени (то есть MINUTES_ADD(date, -n) эквивалентно MINUTES_SUB(date, n)).
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если входное значение даты и времени содержит микросекунды, после прибавления минут исходная точность микросекунд сохраняется (например, '2023-01-01 00:00:00.123456' становится '2023-01-01 00:01:00.123456' после прибавления 1 минуты).
- Если результат вычисления выходит за допустимый диапазон типа DATETIME (от 0000-01-01 00:00:00 до 9999-12-31 23:59:59.999999), возникает исключение.
- Если любой из параметров равен NULL, возвращается NULL.

## Примеры {#examples}

```sql
-- Add minutes to DATE type (default time 00:00:00)
SELECT MINUTES_ADD('2020-02-02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 00:01:00 |
+---------------------+

-- Add minutes to DATETIME
SELECT MINUTES_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:33:18 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_ADD('2023-07-13 22:28:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:38:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to subtraction)
SELECT MINUTES_ADD('2023-07-13 22:28:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:23:18 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MINUTES_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| MINUTES_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:23:33.123+08:00                   |
+-------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_ADD(NULL, 10), MINUTES_ADD('2023-07-13 22:28:18', NULL) AS result;
+-------------------------+--------+
| minutes_add(NULL, 10)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_add of 9999-12-31 23:59:59, 2 out of range
```
