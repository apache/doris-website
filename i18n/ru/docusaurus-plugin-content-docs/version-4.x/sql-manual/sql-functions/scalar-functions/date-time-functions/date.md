---
{
    "title": "DATE | Функции даты и времени",
    "language": "ru",
    "description": "Функция DATE извлекает только дату из значения datetime (которое содержит дату и время), игнорируя информацию о времени.",
    "sidebar_label": "DATE"
}
---

# DATE {#date}

## Описание {#description}

Функция DATE извлекает только дату из значения datetime (которое содержит дату и время), игнорируя информацию о времени. Эта функция позволяет преобразовать тип DATETIME в тип DATE, сохранив только год, месяц и день.

Поведение этой функции соответствует поведению [функции date](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date) в MySQL.

## Синтаксис {#syntax}

```sql
DATE(<date_or_time_part>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<date_or_time_part>` | Допустимое выражение даты типа datetime; поддерживается datetime. Подробнее о форматах datetime и даты см. в разделе [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |

## Возвращаемое значение {#return-value}

Если входное значение допустимо, функция возвращает значение даты типа DATE (в формате YYYY-MM-DD) без времени.
Особые случаи:
- Возвращает NULL, если входное значение равно NULL;

## Примеры {#examples}

```sql
-- Extract the date part from a datetime
mysql> select date(cast('2010-12-02 19:28:30' as datetime));
+-----------------------------------------------+
| date(cast('2010-12-02 19:28:30' as datetime)) |
+-----------------------------------------------+
| 2010-12-02                                    |
+-----------------------------------------------+

-- Extract the date part from a date
mysql> select date(cast('2015-11-02' as date));
+----------------------------------+
| date(cast('2015-11-02' as date)) |
+----------------------------------+
| 2015-11-02                       |
+----------------------------------+

-- Input is NULL
mysql> select date(NULL);
+------------+
| date(NULL) |
+------------+
| NULL       |
+------------+

```
