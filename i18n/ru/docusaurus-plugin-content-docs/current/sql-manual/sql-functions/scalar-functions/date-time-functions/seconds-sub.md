---
{
    "title": "SECONDS_SUB",
    "language": "ru",
    "description": "Вычитает секунды из значения DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ либо добавляет их к нему."
}
---

## Описание {#description}

Функция SECONDS_SUB вычитает указанное количество секунд из заданного значения даты и времени или добавляет их к нему и возвращает вычисленное значение даты и времени. Эта функция поддерживает обработку типов DATE, DATETIME, TIMESTAMP_NS и TIMESTAMPTZ. Если передано отрицательное число, это эквивалентно добавлению соответствующего количества секунд.

Эта функция ведёт себя так же, как [функция date_sub](./date-sub) и [функция date_sub](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) в MySQL, если в качестве единицы измерения используется SECOND.

## Синтаксис {#syntax}

```sql
SECONDS_SUB(<date_or_time_expr>, <seconds>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Обязательный параметр. Входное значение даты и времени. Может иметь тип DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ. Подробные сведения о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<seconds>` | Обязательный параметр. Количество секунд для вычитания или добавления. Поддерживается целочисленный тип (BIGINT). Положительные числа означают вычитание секунд, отрицательные означают добавление секунд. |

## Возвращаемое значение {#return-value}

Возвращает значение исходного времени `<date_or_time_expr>` за вычетом указанного количества секунд `<second>`. Тип возвращаемого значения определяется типом первого параметра:
- Если первый параметр имеет тип `DATE` или `DATETIME`, тип возвращаемого значения будет `DATETIME`; если он имеет тип `TIMESTAMP_NS`, тип возвращаемого значения будет `TIMESTAMP_NS`.
- Если первый параметр имеет тип TIMESTAMPTZ, возвращается значение типа TIMESTAMPTZ.
  
Особые случаи:
- Если `<seconds>` имеет отрицательное значение, функция действует так же, как добавление соответствующего количества секунд к исходному времени (т. е. SECONDS_SUB(date, -n) эквивалентна SECONDS_ADD(date, n)).
- Если входное значение имеет тип DATE (содержит только год, месяц и день), время по умолчанию равно 00:00:00.
- Если результат вычисления выходит за допустимый диапазон типа даты, для типа DATE возникает исключение.
- Если любой из параметров равен NULL, возвращается NULL.

## Примеры {#examples}

```sql
--- Subtract seconds from DATETIME type
SELECT SECONDS_SUB('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- Add seconds to DATETIME type (using negative number)
SELECT SECONDS_SUB('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- Subtract seconds across minute boundary
SELECT SECONDS_SUB('2023-07-14 00:00:10', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 23:59:55 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_SUB('2023-01-01', 3600) AS result;  -- Subtract 1 hour (3600 seconds)
+---------------------+
| result              |
+---------------------+
| 2022-12-31 23:00:00 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT SECONDS_SUB('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:23.123456 |
+----------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT SECONDS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| SECONDS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:22:32.123+08:00                   |
+-------------------------------------------------+

--- Returns NULL when input is NULL
SELECT SECONDS_SUB(NULL, 30), SECONDS_SUB('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_sub(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT SECONDS_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:00, -1 out of range
```
