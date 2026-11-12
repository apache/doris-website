---
{
    "title": "DAYOFWEEK",
    "language": "ru",
    "description": "Функция DAYOFWEEK возвращает номер дня недели для выражения даты или времени по правилу, согласно которому воскресенью соответствует 1,"
}
---

## Описание {#description}

Функция DAYOFWEEK возвращает номер дня недели для выражения даты или времени по следующему правилу: воскресенью соответствует 1, понедельнику соответствует 2, ..., а субботе соответствует 7.

Эта функция работает так же, как [функция dayofweek](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofweek) в MySQL

## Псевдоним {#alias}

- DOW

## Синтаксис {#syntax}

```sql
DAYOFWEEK(<date_or_time_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<date_or_time_expr>` | Допустимое выражение даты типа DATE/DATETIME/TIMESTAMP_NS. Сведения о форматах даты и времени см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает целое число, обозначающее номер дня недели для указанной даты (1-7, где 1 соответствует воскресенью, а 7 соответствует субботе).

Особые случаи:

Если `<date_or_time_expr>` имеет значение NULL, возвращается NULL;

## Примеры {#examples}

```sql
---Calculate weekday index value for date type
select dayofweek('2019-06-25');

+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+

---Calculate weekday index value for datetime type
select dayofweek('2019-06-25 15:30:45');

+----------------------------------+
| dayofweek('2019-06-25 15:30:45') |
+----------------------------------+
|                                3 |
+----------------------------------+
---Index for Sunday
select dayofweek('2024-02-18');
+-------------------------+
| dayofweek('2024-02-18') |
+-------------------------+
|                       1 |
+-------------------------+

---Input datetime is NULL, returns NULL
select dayofweek(NULL);
+-----------------+
| dayofweek(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
