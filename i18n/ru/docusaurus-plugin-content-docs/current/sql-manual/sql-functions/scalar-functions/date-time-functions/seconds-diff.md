---
{
    "title": "SECONDS_DIFF",
    "language": "ru",
    "description": "Функция SECONDSDIFF вычисляет разность между двумя значениями даты и времени и возвращает результат в секундах."
}
---

## Описание {#description}

Функция SECONDS_DIFF вычисляет разность между двумя значениями даты и времени и возвращает результат в секундах. Функция поддерживает обработку типов DATE, DATETIME и TIMESTAMP_NS. Если входное значение имеет тип DATE, его временная часть по умолчанию равна 00:00:00.

## Синтаксис {#syntax}

```sql
SECONDS_DIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr1>` | Обязательный параметр. Конечное значение даты и времени. Поддерживаются `DATE`, `DATETIME` и `TIMESTAMP_NS`. Подробнее о форматах см. в разделах [Преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<date_or_time_expr2>` | Обязательный параметр. Начальное значение даты и времени. Поддерживаются `DATE`, `DATETIME` и `TIMESTAMP_NS`. |

## Возвращаемое значение {#return-value}

Возвращает значение типа BIGINT, представляющее разность в секундах между двумя значениями даты и времени:

- Если `<date_or_time_expr1>` позже, чем `<date_or_time_expr2>`, возвращается положительное число;
- Если `<date_or_time_expr1>` раньше, чем `<date_or_time_expr2>`, возвращается отрицательное число;
- Если оба значения времени равны, возвращается 0;
- Если любой из параметров равен NULL, возвращается NULL;
- Для значений времени с дробной частью секунд при вычислении учитывается разность дробных частей.

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

--- TIMESTAMP_NS can be used for either parameter
SELECT SECONDS_DIFF(CAST('2024-01-01 00:00:02.000000000' AS TIMESTAMP_NS),
                    CAST('2024-01-01 00:00:00' AS DATETIME)) AS result;
+--------+
| result |
+--------+
|      2 |
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
