---
{
    "title": "FROM_MICROSECOND",
    "language": "ru",
    "description": "Функция FROMMICROSECOND преобразует временную метку Unix (в микросекундах) в значение даты и времени типа DATETIME."
}
---

## Описание {#description}

Функция FROM_MICROSECOND преобразует временную метку Unix (в микросекундах) в значение даты и времени типа `DATETIME`. Точка отсчёта временных меток Unix — 1970-01-01 00:00:00 UTC. Эта функция преобразует входное количество микросекунд в соответствующие дату и время после этой точки отсчёта (включая дробную часть секунды с точностью до микросекунд).

## Синтаксис {#syntax}

```sql
FROM_MICROSECOND(<unix_timestamp>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<unix_timestamp>` | Входная временная метка Unix целочисленного типа (BIGINT), представляющая количество микросекунд с 1970-01-01 00:00:00 UTC |

## Возвращаемое значение {#return-value}

Возвращает значение типа DATETIME, полученное в результате преобразования временной метки Unix в часовом поясе UTC во время в текущем часовом поясе
- Если <unix_timestamp> имеет значение NULL, функция возвращает NULL.
- Если входное значение <unix_timestamp> можно преобразовать в целое число секунд, возвращается datetime без дробной части секунд; в противном случае возвращается datetime с дробной частью секунд
- Если <unix_timestamp> меньше 0, возвращается ошибка
- Если возвращаемое значение datetime превышает максимально допустимые дату и время 9999-12-31 23:59:59, возвращается ошибка

## Примеры {#examples}

```sql

-- Current machine is in East 8th timezone, so the returned time is 8 hours ahead of UTC
SELECT FROM_MICROSECOND(0);
+----------------------------+
| FROM_MICROSECOND(0)        |
+----------------------------+
| 1970-01-01 08:00:00.000000 |
+----------------------------+

-- Convert 1700000000000000 microseconds added to reference time to datetime
SELECT FROM_MICROSECOND(1700000000000000);

+------------------------------------+
| from_microsecond(1700000000000000) |
+------------------------------------+
| 2023-11-15 06:13:20                |
+------------------------------------+

-- Timestamp contains non-integer seconds (1700000000 seconds + 123456 microseconds)
select from_microsecond(1700000000123456) as dt_with_micro;

+----------------------------+
| dt_with_micro              |
+----------------------------+
| 2023-11-15 06:13:20.123456 |
+----------------------------+

-- Input negative number, returns error
 select from_microsecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of -1 out of range


-- Input NULL, returns NULL
select from_microsecond(NULL);
+------------------------+
| from_microsecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

-- Exceeds maximum time range 9999-12-31 23:59:59, returns error
select from_microsecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of 999999999999999999 out of range
```
