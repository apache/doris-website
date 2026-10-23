---
{
    "title": "DATE | Функции даты и времени",
    "language": "ru",
    "description": "Извлекает дату из значения DATETIME или TIMESTAMP_NS, игнорируя поля времени и долей секунды.",
    "sidebar_label": "DATE"
}
---

# DATE {#date}

## Описание {#description}

Функция DATE извлекает дату из значения `DATETIME` или `TIMESTAMP_NS`, игнорируя поля времени и долей секунды.

Поведение этой функции соответствует [функции date](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date) в MySQL.

## Синтаксис {#syntax}

```sql
DATE(<date_or_time_part>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<date_or_time_part>` | Выражение типа `DATETIME` или `TIMESTAMP_NS`. |

## Возвращаемое значение {#return-value}

Если входное значение допустимо, функция возвращает дату типа DATE (в формате YYYY-MM-DD), без времени.
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
