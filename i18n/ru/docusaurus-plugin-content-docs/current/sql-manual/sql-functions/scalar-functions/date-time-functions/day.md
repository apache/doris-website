---
{
    "title": "DAY",
    "language": "ru",
    "description": "Функция DAY используется для извлечения компонента «день» из выражения даты или времени,"
}
---

## Описание {#description}

Функция DAY извлекает компонент «день» из выражения даты или времени, возвращая целое число от 1 до 31 (в зависимости от месяца и года).

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
| `<date_or_time_expr>` | Допустимое выражение даты, поддерживающее типы DATE/DATETIME/TIMESTAMP_NS. Сведения о конкретных форматах даты и времени см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает целое число (1-31), соответствующее дню месяца в дате.

Особые случаи:

Если `dt` имеет значение NULL, возвращается NULL;

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
