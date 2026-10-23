---
{
    "title": "TIMEDIFF",
    "language": "ru",
    "description": "Вычисляет разность значений DATE, DATETIME или TIMESTAMP_NS и возвращает значение TIME."
}
---

## Описание {#description}

Функция TIMEDIFF вычисляет разность двух значений `DATE`, `DATETIME` или `TIMESTAMP_NS` и возвращает результат в виде значения `TIME`. Для входного значения `DATE` время принимается равным 00:00:00.

Поведение этой функции соответствует поведению [функции timediff](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timediff) в MySQL.

## Синтаксис {#syntax}

```sql
TIMEDIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## Параметры {#parameters}

| Параметр              | Описание                                                                                                                                                                                                                                                              |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<date_or_time_expr1>` | Конечное значение времени или даты и времени. Поддерживаются входные значения типов DATE/DATETIME/TIMESTAMP_NS. Подробнее о форматах даты и времени см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Начальное значение времени или даты и времени. Поддерживаются входные значения типов DATE/DATETIME/TIMESTAMP_NS                                                                                                                                                                                                  |

## Возвращаемое значение {#return-value}

Возвращает значение типа `TIME`, представляющее разность времени между двумя входными значениями:
- Если `<end_datetime>` позже `<start_datetime>`, возвращает положительную разность времени
- Если `<end_datetime>` раньше `<start_datetime>`, возвращает отрицательную разность времени
- Если `<end_datetime>` и `<start_datetime>` равны, возвращает `00:00:00`
- Если `<end_datetime>` или `<start_datetime>` имеет значение `NULL`, функция возвращает `NULL`
- Если возвращаемая разность времени не равна целому числу секунд, результат содержит дробную часть секунд
- Если результат вычисления выходит за пределы диапазона времени [-838:59:59, 838:59:59], возвращает ошибку

## Примеры {#examples}

```sql
-- Difference between two DATETIMEs (spanning days)
SELECT TIMEDIFF('2024-07-20 16:59:30', '2024-07-11 16:35:21') AS result;
+-----------+
| result    |
+-----------+
| 216:24:09 |
+-----------+

-- Difference between datetime and date (date defaults to 00:00:00)
SELECT TIMEDIFF('2023-10-05 15:45:00', '2023-10-05') AS result;
+-----------+
| result    |
+-----------+
| 15:45:00  |
+-----------+

-- End time earlier than start time (returns negative value)
SELECT TIMEDIFF('2023-01-01 09:00:00', '2023-01-01 10:30:00') AS result;
+------------+
| result     |
+------------+
| -01:30:00  |
+------------+

-- Time difference within the same date
SELECT TIMEDIFF('2023-12-31 23:59:59', '2023-12-31 23:59:50') AS result;
+-----------+
| result    |
+-----------+
| 00:00:09  |
+-----------+

-- Difference across years
SELECT TIMEDIFF('2024-01-01 00:00:01', '2023-12-31 23:59:59') AS result;
+-----------+
| result    |
+-----------+
| 00:00:02  |
+-----------+

-- When returned time is not an integer number of seconds, returns time with scale
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2023-07-13 12:34:50.123') AS result;
+--------------+
| result       |
+--------------+
| 00:00:06.666 |
+--------------+

-- Calculation result exceeds time size range, returns error
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2024-07-13 12:34:50.123') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]The function timediff result of 2023-07-13 12:34:56.789000, 2024-07-13 12:34:50.123000 is out of range

-- Any parameter is NULL (returns NULL)
SELECT TIMEDIFF(NULL, '2023-01-01 00:00:00'), TIMEDIFF('2023-01-01 00:00:00', NULL) AS result;
+---------------------------------------+--------+
| timediff(NULL, '2023-01-01 00:00:00') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+
```
