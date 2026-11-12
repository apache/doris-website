---
{
    "title": "UTC_TIMESTAMP",
    "language": "ru",
    "description": "Функция UTCTIMESTAMP возвращает текущие дату и время в часовом поясе UTC."
}
---

## Описание {#description}
Функция UTC_TIMESTAMP возвращает текущие дату и время в часовом поясе UTC. Она не зависит от локального часового пояса и всегда возвращает текущее время по UTC, обеспечивая согласованность времени при работе с разными часовыми поясами.

Поведение этой функции соответствует поведению [функции utc_timestamp](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp) в MySQL.

## Синтаксис {#syntax}

```sql
UTC_TIMESTAMP([`<precision>`])
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<precision>` | Точность возвращаемого значения даты и времени задаётся целым числом в диапазоне [0, 6]. Допускаются только константы целочисленного типа. |

## Возвращаемое значение {#return-value}
Возвращает текущие дату и время по UTC.

Возвращает значение типа DATETIME (формат: YYYY-MM-DD HH:mm:ss[.ssssss]). При использовании возвращённого результата в арифметических операциях он преобразуется в [целочисленный формат](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-datetime) (формат YYYYMMDDHHmmss).

Если входное значение равно NULL или точность выходит за допустимый диапазон, возникает ошибка.

## Примеры {#examples}

```sql
-- Current local time is UTC+8 2025-10-27 14:43:21
SELECT UTC_TIMESTAMP(), UTC_TIMESTAMP() + 0, UTC_TIMESTAMP(5), UTC_TIMESTAMP(5) + 0;
```
```text
+---------------------+---------------------+---------------------------+----------------------+
| UTC_TIMESTAMP()     | UTC_TIMESTAMP() + 0 | UTC_TIMESTAMP(5)          | UTC_TIMESTAMP(5) + 0 |
+---------------------+---------------------+---------------------------+----------------------+
| 2025-10-27 06:43:21 |      20251027064321 | 2025-10-27 06:43:21.88177 |       20251027064321 |
+---------------------+---------------------+---------------------------+----------------------+
```

```sql
SELECT UTC_TIMESTAMP(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6

SELECT UTC_TIMESTAMP(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIMESTAMP argument cannot be NULL.
```
