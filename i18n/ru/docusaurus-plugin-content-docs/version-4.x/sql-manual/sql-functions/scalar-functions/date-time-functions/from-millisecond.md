---
{
    "title": "FROM_MILLISECOND",
    "language": "ru",
    "description": "Функция FROMMILLISECOND преобразует временную метку Unix (в миллисекундах) в значение даты и времени типа DATETIME."
}
---

## Описание {#description}

Функция FROM_MILLISECOND преобразует временную метку Unix (в миллисекундах) в значение даты и времени типа DATETIME. Отсчёт временных меток Unix начинается с 1970-01-01 00:00:00 UTC. Функция преобразует входное количество миллисекунд в соответствующую дату и время после этого момента (с точностью до миллисекунд).

## Синтаксис {#syntax}

```sql
FROM_MILLISECOND(<millisecond>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<millisecond>` | Входная временная метка Unix целочисленного типа (BIGINT), представляющая количество миллисекунд с 1970-01-01 00:00:00 UTC. |

## Возвращаемое значение {#return-value}

Возвращает значение типа DATETIME, полученное при преобразовании входной временной метки Unix из часового пояса UTC в текущий часовой пояс.
- Если millisecond имеет значение NULL, функция возвращает NULL.
- Если millisecond выходит за допустимый диапазон (полученная дата и время превышают 9999-12-31 23:59:59), функция возвращает ошибку.
- Если входное значение millisecond соответствует целому числу секунд, возвращается datetime без дробной части секунд; в противном случае возвращается datetime с дробной частью секунд.
- Если входное значение отрицательное, функция возвращает ошибку.

## Примеры {#examples}

```sql

----Since the current machine is in East 8th timezone, the returned time is 8 hours ahead of UTC
SELECT FROM_MILLISECOND(0);
+-------------------------+
| FROM_MILLISECOND(0)     |
+-------------------------+
| 1970-01-01 08:00:00.000 |
+-------------------------+

-- Convert 1700000000000 milliseconds to datetime
SELECT FROM_MILLISECOND(1700000000000);

+---------------------------------+
| from_millisecond(1700000000000) |
+---------------------------------+
| 2023-11-15 06:13:20             |
+---------------------------------+

-- Timestamp contains non-zero milliseconds (1700000000 seconds + 123 milliseconds)
select from_millisecond(1700000000123) as dt_with_milli;

+----------------------------+
| dt_with_milli              |
+----------------------------+
| 2023-11-15 06:13:20.123000 |
+----------------------------+

---Input is NULL, result returns NULL
select from_millisecond(NULL);
+------------------------+
| from_millisecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

---Input is negative, result returns error
 select from_millisecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_millisecond of -1 out of range


--Result exceeds maximum date, returns error
select from_millisecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_millisecond of 999999999999999999 out of range
```
