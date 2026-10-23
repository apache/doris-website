---
{
    "title": "SEC_TO_TIME",
    "language": "ru",
    "description": "Функция SECTOTIME преобразует числовое значение в секундах в тип TIME. Возвращаемое значение имеет формат HH:MM:SS или HH:MM:SS.ssssss."
}
---

## Описание {#description}

Функция SEC_TO_TIME преобразует числовое значение в секундах в тип TIME. Возвращаемое значение имеет формат HH:MM:SS или HH:MM:SS.ssssss. Входное значение представляет время в секундах от начала суток (00:00:00.000000). Поддерживаются положительные и отрицательные значения, а также интервалы, превышающие одни сутки.

Поведение этой функции соответствует [функции sec_to_time](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_sec-to-time) в MySQL.

## Синтаксис {#syntax}

```sql
SEC_TO_TIME(<seconds>)
```

## Параметры {#parameters}

| Параметр    | Описание                                                                                                                                                      |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<seconds>` | Обязательный параметр. Входное количество секунд, отсчитываемых от начала суток (00:00:00). Поддерживаются положительные и отрицательные целые числа. |

## Возвращаемое значение {#return-value}

Возвращает значение типа TIME, полученное преобразованием секунд.
- Если входное количество секунд выходит за допустимый диапазон типа TIME (от -838:59:59 до 838:59:59, что соответствует диапазону секунд от -3020399 до 3020399), возвращается максимальное или минимальное значение типа TIME
- Если входное значение равно NULL, возвращается NULL
- Если входное значение является целым числом, возвращаемое значение имеет формат HH:MM:SS; если входное значение является числом с плавающей точкой, возвращаемое значение имеет формат HH:MM:SS.ssssss.

## Примеры {#examples}

```sql
-- Positive seconds (time within the day)
SELECT SEC_TO_TIME(59738) AS result;
+----------+
| result   |
+----------+
| 16:35:38 |
+----------+

-- Seconds exceeding one day (automatically converted to multiple hours)
SELECT SEC_TO_TIME(90061) AS result;
+----------+
| result   |
+----------+
| 25:01:01 |
+----------+

-- Negative seconds (time from previous day)
SELECT SEC_TO_TIME(-3600) AS result;
+----------+
| result   |
+----------+
| -01:00:00 |
+----------+

-- Zero seconds (start time)
SELECT SEC_TO_TIME(0) AS result;
+----------+
| result   |
+----------+
| 00:00:00 |
+----------+

-- Decimal seconds
SELECT SEC_TO_TIME(3661.9) AS result;
+-----------------+
| result          |
+-----------------+
| 01:01:01.900000 |
+-----------------+

-- Input is NULL (returns NULL)
SELECT SEC_TO_TIME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- If the input seconds exceed the valid range of TIME type (-838:59:59 to 838:59:59, corresponding to seconds range -3020399 to 3020399), returns TIME max or min value
 SELECT SEC_TO_TIME(30245000) AS result;
+-----------+
| result    |
+-----------+
| 838:59:59 |
+-----------+

SELECT SEC_TO_TIME(-30245000) AS result;
+------------+
| result     |
+------------+
| -838:59:59 |
+------------+
```
