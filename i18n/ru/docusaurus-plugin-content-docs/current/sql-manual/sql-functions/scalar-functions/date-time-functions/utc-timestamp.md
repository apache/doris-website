---
{
    "title": "UTC_TIMESTAMP",
    "language": "ru",
    "description": "Функция UTCTIMESTAMP возвращает текущие дату и время в часовом поясе UTC."
}
---

## Описание {#description}
Функция UTC_TIMESTAMP возвращает текущие дату и время в часовом поясе UTC. Эта функция не зависит от локального часового пояса и всегда возвращает текущее время по UTC, обеспечивая согласованность времени при работе с разными часовыми поясами.

Поведение этой функции соответствует поведению [функции utc_timestamp](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp) в MySQL.

## Синтаксис {#syntax}

```sql
UTC_TIMESTAMP([`<precision>`])
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<precision>` | Необязательная целочисленная константа в диапазоне `[0, 9]`. Значение по умолчанию — 0. |

## Возвращаемое значение {#return-value}
Возвращает текущие дату и время по UTC.

При точности от 0 до 6 возвращает `DATETIME(<precision>)`. При точности от 7 до 9 возвращает `TIMESTAMP_NS`, который отображается с девятью цифрами в дробной части. При использовании возвращённого результата в числовых операциях он преобразуется в [целочисленный формат](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-datetime) (формат YYYYMMDDHHmmss). В пределах одного оператора значение остаётся постоянным.

Если передано NULL или значение точности выходит за допустимые границы, возникает ошибка.

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
SELECT UTC_TIMESTAMP(10);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of UTC_TIMESTAMP must be between 0 and 9. Precision was set to: 10

SELECT UTC_TIMESTAMP(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIMESTAMP argument cannot be NULL.
```
