---
{
    "title": "LAST_DAY",
    "language": "ru",
    "description": "Возвращает последний день месяца, на который приходится входная дата. В зависимости от месяца это:"
}
---

## Описание {#description}

Возвращает последний день месяца, на который приходится входная дата. В зависимости от месяца это:

- 28-е число: февраль в обычном (невисокосном) году
- 29-е число: февраль в високосном году
- 30-е число: апрель, июнь, сентябрь, ноябрь
- 31-е число: январь, март, май, июль, август, октябрь, декабрь

Эта функция работает так же, как [функция LAST_DAY](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_last-day) в MySQL.

## Синтаксис {#syntax}

```sql
LAST_DAY(`<date_or_time_expr>`)
```

## Аргументы {#arguments}

| Параметр | Описание |
| --- | --- |
| `<date_or_time_expr>` | Допустимое выражение даты. Поддерживаются типы `DATE`/`DATETIME`. Точные форматы см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |

## Возвращаемое значение {#return-value}

Возвращает значение типа `DATE`, представляющее последний день месяца входной даты (формат `YYYY-MM-DD`).

- Если входное значение равно `NULL`, возвращает `NULL`.

## Примеры {#examples}

```sql
-- Input is DATE; returns the last day of February in a leap year
mysql> SELECT LAST_DAY('2000-02-03');
+------------------------+
| LAST_DAY('2000-02-03') |
+------------------------+
| 2000-02-29             |
+------------------------+

-- Input is DATETIME; time part is ignored
mysql> SELECT LAST_DAY('2023-04-15 12:34:56');
+---------------------------------+
| LAST_DAY('2023-04-15 12:34:56') |
+---------------------------------+
| 2023-04-30                      |
+---------------------------------+

-- February in a common (non‑leap) year
mysql> SELECT LAST_DAY('2021-02-01');
+------------------------+
| LAST_DAY('2021-02-01') |
+------------------------+
| 2021-02-28             |
+------------------------+

-- Example of a 31‑day month
mysql> SELECT LAST_DAY('2023-01-10');
+------------------------+
| LAST_DAY('2023-01-10') |
+------------------------+
| 2023-01-31             |
+------------------------+

-- Input is NULL; returns NULL
mysql> SELECT LAST_DAY(NULL);
+----------------+
| LAST_DAY(NULL) |
+----------------