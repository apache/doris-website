---
{
    "title": "MINUTE",
    "language": "ru",
    "description": "Функция MINUTE извлекает минуты из входного значения даты и времени и возвращает целое число в диапазоне от 0 до 59."
}
---

## Описание {#description}

Функция MINUTE извлекает минуты из входного значения даты и времени и возвращает целое число в диапазоне от 0 до 59. Эта функция поддерживает обработку типов DATE, DATETIME, TIMESTAMP_NS и TIME.

Эта функция работает так же, как [функция minute](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_minute) в MySQL.

## Синтаксис {#syntax}

```sql
MINUTE(`<date_or_time_expr>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Входное значение даты и времени типа DATE, DATETIME, TIMESTAMP_NS или TIME. Сведения о конкретных форматах даты и времени, даты и времени суток см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) и [преобразование времени](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion). |

## Возвращаемое значение {#return-value}

Возвращает целое число типа INT, представляющее значение минут из входного значения даты и времени, в диапазоне 0-59.

- Если входное значение имеет тип DATE (содержит только год, месяц и день), время по умолчанию равно 00:00:00, поэтому возвращается 0.
- Если входное значение равно NULL, возвращается NULL.

## Примеры {#examples}

```sql
-- Extract minute from DATETIME
SELECT MINUTE('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Extract minute from DATETIME with microseconds (ignores microseconds)
SELECT MINUTE('2023-05-01 10:05:30.123456') AS result;
+--------+
| result |
+--------+
|      5 |
+--------+

SELECT MINUTE('14:25:45') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

-- Extract minute from DATE type (default time 00:00:00)
SELECT MINUTE('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Input is NULL, returns NULL
SELECT MINUTE(NULL) AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+
```
