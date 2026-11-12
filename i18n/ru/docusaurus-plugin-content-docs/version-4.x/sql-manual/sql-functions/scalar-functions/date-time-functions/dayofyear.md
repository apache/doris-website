---
{
    "title": "DAYOFYEAR",
    "language": "ru",
    "description": "Функция DAYOFYEAR используется для определения порядкового номера дня в году по выражению даты или времени, то есть"
}
---

## Описание {#description}

Функция DAYOFYEAR используется для определения порядкового номера дня в году по выражению даты или времени, то есть показывает, каким по счёту днём года является указанная дата. Возвращаемое значение — целое число в диапазоне от 1 (1 января) до 366 (31 декабря високосного года).

Поведение этой функции соответствует поведению [функции dayofyear](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofyear) в MySQL

## Псевдоним {#alias}

- DOY

## Синтаксис {#syntax}

```sql
DAYOFYEAR(<date_or_time_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<date_or_time_expr>` | Корректное выражение даты, поддерживающее типы date/datetime. Сведения о конкретных форматах datetime и date см. в разделах [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает целое число типа SMALLINT, обозначающее порядковый номер дня в году (1-366).

Особые случаи:

- Если <date_or_time_expr> имеет значение NULL, возвращается NULL;
- Для 29 февраля високосного года корректно определяется 60-й день года.

## Примеры {#examples}

```sql

---Extract the day number in the year from datetime type
select dayofyear('2007-02-03 00:00:00');

+----------------------------------+
| dayofyear('2007-02-03 00:00:00') |
+----------------------------------+
|                               34 |
+----------------------------------+

---Extract day number from date type
select dayofyear('2023-12-31');
+-------------------------+
| dayofyear('2023-12-31') |
+-------------------------+
|                     365 |
+-------------------------+


---Calculate day number in a leap year
select dayofyear('2024-12-31');
+-------------------------+
| dayofyear('2024-12-31') |
+-------------------------+
|                     366 |
+-------------------------+

---Input is NULL, returns NULL
select dayofyear(NULL);
+-----------------+
| dayofyear(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
