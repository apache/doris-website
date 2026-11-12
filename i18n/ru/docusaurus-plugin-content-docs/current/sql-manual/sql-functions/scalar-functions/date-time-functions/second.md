---
{
    "title": "SECOND",
    "language": "ru",
    "description": "Функция SECOND извлекает секунды из указанного значения даты и времени, возвращая целое число от 0 до 59."
}
---

## Описание {#description}

Функция SECOND извлекает секунды из указанного значения даты и времени, возвращая целое число от 0 до 59. Эта функция поддерживает обработку типов DATE, DATETIME, TIMESTAMP_NS и TIME.

Поведение этой функции соответствует [функции second](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_second) в MySQL.

## Синтаксис {#syntax}

```sql
SECOND(<date_or_time_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Входное значение даты и времени. Может иметь тип DATE, DATETIME, TIMESTAMP_NS или TIME. Подробнее о форматах даты и времени, даты и времени по отдельности см. в разделах [Преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [Преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) и [Преобразование времени](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion). |

## Возвращаемое значение {#return-value}

Возвращает значение типа INT, соответствующее секундной части входного значения даты и времени:

- Диапазон: от 0 до 59 (включительно)
- Если входное значение имеет тип DATE, возвращает 0 (поскольку время по умолчанию равно 00:00:00)
- Если входное значение равно NULL, возвращает NULL
- Игнорирует микросекундную часть (например, из 12:34:56.789 извлекается только 56 секунд)

## Примеры {#examples}

```sql
-- Extract seconds from DATETIME
SELECT SECOND('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Input is TIME type
SELECT SECOND(cast('15:42:33' as time)) AS result;
+--------+
| result |
+--------+
|     33 |
+--------+

-- Input is DATE type (default seconds is 0)
SELECT SECOND('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Time with microseconds (ignores microseconds)
SELECT SECOND('2023-07-13 10:30:25.123456') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

-- Case where seconds is 0
SELECT SECOND('2024-01-01 00:00:00') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- When a string literal is valid for both datetime and time, prefer parsing it as time
SELECT SECOND("22:12:12");
+--------------------+
| SECOND("22:12:12") |
+--------------------+
|                 12 |
+--------------------+

-- Input is NULL (returns NULL)
SELECT SECOND(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
