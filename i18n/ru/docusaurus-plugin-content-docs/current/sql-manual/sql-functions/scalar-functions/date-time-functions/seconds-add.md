---
{
    "title": "SECONDS_ADD",
    "language": "ru",
    "description": "Прибавляет секунды к значению DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ либо вычитает их из него."
}
---

## Описание {#description}

Функция SECONDS_ADD прибавляет заданное количество секунд к указанному значению даты и времени или вычитает их из него и возвращает вычисленное значение даты и времени. Функция поддерживает обработку типов DATE, DATETIME, TIMESTAMP_NS и TIMESTAMPTZ. Передача отрицательного числа эквивалентна вычитанию соответствующего количества секунд.

Поведение этой функции соответствует поведению [функции date_add](./date-add) и [функции date_add](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) в MySQL при использовании SECOND в качестве единицы измерения.

## Синтаксис {#syntax}

```sql
SECONDS_ADD(<date_or_time_expr>, <seconds>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Обязательный параметр. Входное значение даты и времени. Может иметь тип DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ. Сведения о конкретных форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<seconds>` | Обязательный параметр. Количество секунд для прибавления или вычитания. Поддерживается целочисленный тип (BIGINT). Положительные числа означают прибавление секунд, отрицательные — вычитание. |

## Возвращаемое значение {#return-value}

Возвращает результат прибавления к исходному значению времени `<date_or_time_expr>` указанного количества секунд `<second>`. Тип возвращаемого значения определяется типом первого параметра:
- Если первый параметр имеет тип `DATE` или `DATETIME`, возвращаемый тип — `DATETIME`; если он имеет тип `TIMESTAMP_NS`, возвращаемый тип — `TIMESTAMP_NS`.
- Если первый параметр имеет тип TIMESTAMPTZ, возвращаемый тип — TIMESTAMPTZ.

Особые случаи:
- Если `<seconds>` имеет отрицательное значение, функция вычитает соответствующее количество секунд из исходного значения времени (то есть SECONDS_ADD(date, -n) эквивалентно SECONDS_SUB(date, n)).
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если результат вычисления выходит за допустимый диапазон типа даты (тип DATE: от 0000-01-01 до 9999-12-31; тип DATETIME/TIMESTAMPTZ: от 0000-01-01 00:00:00 до 9999-12-31 23:59:59.999999), возвращается ошибка.
- Если любой из параметров равен NULL, возвращается NULL.

## Примеры {#examples}

```sql
--- Add seconds to DATETIME type
SELECT SECONDS_ADD('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- Subtract seconds from DATETIME type (using negative number)
SELECT SECONDS_ADD('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- Add seconds across minute boundary
SELECT SECONDS_ADD('2023-07-13 23:59:50', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-14 00:00:05 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_ADD('2023-01-01', 3600) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 01:00:00 |
+---------------------+

--- DATETIME with scale (preserves precision)
SELECT SECONDS_ADD('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:27.123456 |
+----------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT SECONDS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| SECONDS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:22:34.123+08:00                   |
+-------------------------------------------------+

--- Returns NULL when input is NULL
SELECT SECONDS_ADD(NULL, 30), SECONDS_ADD('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_add(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT SECONDS_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 9999-12-31 23:59:59, 2 out of range

select seconds_add('0000-01-01 00:00:30',-31);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:30, -31 out of range
```
