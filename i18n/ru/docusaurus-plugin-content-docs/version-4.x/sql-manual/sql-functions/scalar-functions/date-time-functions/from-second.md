---
{
    "title": "FROM_SECOND",
    "language": "ru",
    "description": "Функция FROMSECOND используется для преобразования временной метки Unix (в секундах) в значение даты и времени типа DATETIME."
}
---

## Описание {#description}
Функция FROM_SECOND используется для преобразования временной метки Unix (в секундах) в значение даты и времени типа DATETIME. За начало отсчёта временных меток Unix принято 1970-01-01 00:00:00 UTC. Функция преобразует входное количество секунд в соответствующие дату и время после этого момента (с точностью до секунды).

## Синтаксис {#syntax}

```sql
FROM_SECOND(<unix_timestamp>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<unix_timestamp>` | Входная временная метка Unix целочисленного типа (BIGINT), представляющая количество секунд, прошедших с 1970-01-01 00:00:00 UTC. |

## Возвращаемое значение {#return-value}

- Возвращает значение типа DATETIME, полученное при преобразовании входной временной метки Unix из часового пояса UTC в текущий часовой пояс
- Если <unix_timestamp> равен NULL, функция возвращает NULL.
- Если <unix_timestamp> выходит за допустимый диапазон (полученные дата и время превышают 9999-12-31 23:59:59), функция возвращает ошибку.
- При вводе отрицательного количества секунд функция возвращает ошибку

## Примеры {#examples}

```sql

----Since the current machine is in East 8th timezone, the returned time is 8 hours ahead of UTC
 SELECT FROM_SECOND(0);
+---------------------+
| FROM_SECOND(0)      |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---Convert 1700000000 seconds to datetime
SELECT FROM_SECOND(1700000000);

+-------------------------+
| from_second(1700000000) |
+-------------------------+
| 2023-11-15 06:13:20     |
+-------------------------+

---Result exceeds maximum date range, returns error
select from_second(999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INTERNAL_ERROR]The function from_second Argument value is out of DateTime range

---Input parameter is NULL, returns NULL
select from_second(NULL);
+-------------------+
| from_second(NULL) |
+-------------------+
| NULL              |
+-------------------+

--Input parameter is negative, result returns error
 select from_second(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_second of -1 out of range
```
