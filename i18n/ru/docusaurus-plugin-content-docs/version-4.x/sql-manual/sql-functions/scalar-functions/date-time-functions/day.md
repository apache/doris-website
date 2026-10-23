---
{
    "title": "DAY",
    "language": "ru",
    "description": "Функция DAY используется для извлечения компонента «день» из выражения даты или времени,"
}
---

## Описание {#description}

Функция DAY используется для извлечения компонента «день» из выражения даты или времени и возвращает целое число в диапазоне от 1 до 31 (в зависимости от месяца и года).

Поведение этой функции соответствует поведению [функции day](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_day) в MySQL

## Псевдоним {#alias}

- dayofmonth

## Синтаксис {#syntax}

```sql
DAY(<date_or_time_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<date_or_time_expr>` | Корректное выражение даты, поддерживающее типы date/datetime. Подробнее о форматах datetime и date см. в разделах [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает день месяца в виде целого числа (1-31).

Особые случаи:

Если `dt` имеет значение NULL, возвращает NULL;

## Примеры {#examples}

```sql

--Extract day from DATE type
select day('1987-01-31');
+----------------------------+
| day('1987-01-31 00:00:00') |
+----------------------------+
|                         31 |
+----------------------------+

---Extract day from DATETIME type (ignoring time part)
select day('2023-07-13 22:28:18');
+----------------------------+
| day('2023-07-13 22:28:18') |
+----------------------------+
|                         13 |
+----------------------------+

---Input is NULL
select day(NULL);
+-----------+
| day(NULL) |
+-----------+
|      NULL |
+-----------+
```
