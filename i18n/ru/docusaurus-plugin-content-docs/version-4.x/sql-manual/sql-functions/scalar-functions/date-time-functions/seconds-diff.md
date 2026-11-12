---
{
    "title": "SECONDS_DIFF",
    "language": "ru",
    "description": "Функция SECONDSDIFF вычисляет разницу между двумя значениями даты и времени и возвращает результат в секундах."
}
---

## Описание {#description}

Функция SECONDS_DIFF вычисляет разницу между двумя значениями даты и времени и возвращает результат в секундах. Функция поддерживает типы DATE и DATETIME. Если входное значение имеет тип DATE, его временная часть по умолчанию равна 00:00:00.

## Синтаксис {#syntax}

```sql
SECONDS_DIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr1>` | Обязательный. Конечное значение даты и времени. Может иметь тип DATE или DATETIME. Подробнее о форматах даты и времени см. в разделах [Преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Обязательный. Начальное значение даты и времени. Может иметь тип DATE или DATETIME. |

## Возвращаемое значение {#return-value}

Возвращает значение типа BIGINT, представляющее разницу в секундах между двумя значениями даты и времени:

- Если `<date_or_time_expr1>` позже, чем `<date_or_time_expr2>`, возвращает положительное число;
- Если `<date_or_time_expr1>` раньше, чем `<date_or_time_expr2>`, возвращает отрицательное число;
- Если оба значения времени равны, возвращает 0;
- Если какой-либо параметр равен NULL, возвращает NULL;
- Для значений времени с дробной частью секунды при расчёте учитывается разница дробных частей.

## Примеры {#examples}

```sql
--- Seconds difference within the same hour
SELECT SECONDS_DIFF('2025-01-23 12:35:56', '2025-01-23 12:34:56') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

--- End time is earlier than start time (returns negative number)
SELECT SECONDS_DIFF('2023-01-01 00:00:00', '2023-01-01 00:01:00') AS result;
+--------+
| result |
+--------+
|    -60 |
+--------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_DIFF('2023-01-02', '2023-01-01') AS result;  -- 1 day difference (86400 seconds)
+--------+
| result |
+--------+
|  86400 |
+--------+

--- Times with scale include fractional part difference in calculation
mysql> SELECT SECONDS_DIFF('2023-07-13 12:00:00', '2023-07-13 11:59:59.6') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Any parameter is NULL (returns NULL)
SELECT SECONDS_DIFF(NULL, '2023-07-13 10:30:25'), SECONDS_DIFF('2023-07-13 10:30:25', NULL) AS result;
+-------------------------------------------+--------+
| seconds_diff(NULL, '2023-07-13 10:30:25') | result |
+-------------------------------------------+--------+
| NULL                                      | NULL   |
+-------------------------------------------+--------+
```
