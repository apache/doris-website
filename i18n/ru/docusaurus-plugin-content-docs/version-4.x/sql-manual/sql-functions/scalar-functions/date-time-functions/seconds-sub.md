---
{
    "title": "SECONDS_SUB",
    "language": "ru",
    "description": "Функция SECONDSSUB вычитает указанное количество секунд из заданного значения даты и времени или прибавляет его к этому значению и возвращает результат вычисления."
}
---

## Описание {#description}

Функция SECONDS_SUB вычитает указанное количество секунд из заданного значения даты и времени или прибавляет его к этому значению и возвращает результат вычисления. Функция поддерживает типы DATE, DATETIME и TIMESTAMPTZ. Передача отрицательного числа эквивалентна прибавлению соответствующего количества секунд.

Поведение этой функции соответствует поведению [функции date_sub](./date-sub) и [функции date_sub](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) в MySQL при использовании SECOND в качестве единицы измерения.

## Синтаксис {#syntax}

```sql
SECONDS_SUB(<date_or_time_expr>, <seconds>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Обязательный параметр. Входное значение даты и времени. Может иметь тип DATE, DATETIME или TIMESTAMPTZ. Подробную информацию о форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<seconds>` | Обязательный параметр. Количество секунд, которое нужно вычесть или прибавить. Поддерживается целочисленный тип (BIGINT). Положительные числа означают вычитание секунд, отрицательные — прибавление. |

## Возвращаемое значение {#return-value}

Возвращает значение базового времени `<date_or_time_expr>` за вычетом указанного количества секунд `<second>`. Тип возвращаемого значения определяется типом первого параметра:
- Если первый параметр имеет тип DATE/DATETIME, возвращается значение типа DATETIME.
- Если первый параметр имеет тип TIMESTAMPTZ, возвращается значение типа TIMESTAMPTZ.
  
Особые случаи:
- Если `<seconds>` имеет отрицательное значение, функция прибавляет соответствующее количество секунд к базовому времени (то есть SECONDS_SUB(date, -n) эквивалентно SECONDS_ADD(date, n)).
- Если входное значение имеет тип DATE (содержит только год, месяц и день), время по умолчанию равно 00:00:00.
- Если результат вычисления выходит за пределы допустимого диапазона типа даты, для типа DATE возникает исключение.
- Если какой-либо параметр равен NULL, возвращается NULL.

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
