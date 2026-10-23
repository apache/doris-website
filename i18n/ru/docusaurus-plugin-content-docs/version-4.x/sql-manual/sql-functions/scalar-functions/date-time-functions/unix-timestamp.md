---
{
    "title": "UNIX_TIMESTAMP",
    "language": "ru",
    "description": "Преобразует значения типов Date или Datetime в метки времени Unix."
}
---

## Описание {#description}

Преобразует значения типов Date или Datetime в метки времени Unix.

Если параметры не указаны, в метку времени преобразуется текущее время.

Параметры должны иметь тип Date или Datetime.

Спецификацию формата см. в описании формата функции date_format.

На результат этой функции влияет часовой пояс. Подробную информацию о часовых поясах см. в разделе [Управление часовыми поясами](../../../../admin-manual/cluster-management/time-zone).

Поведение этой функции соответствует поведению [функции unix_timestamp](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_unix-timestamp) в MySQL.

## Синтаксис {#syntax}

```sql
UNIX_TIMESTAMP()
UNIX_TIMESTAMP(`<date_or_date_expr>`)
UNIX_TIMESTAMP(`<date_or_date_expr>`, `<fmt>`)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_date_expr>` | Входное значение даты и времени; поддерживаются типы date/datetime. О форматах datetime и date см. в разделах [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<fmt>` | Параметр даты задаёт конкретную часть, которую нужно преобразовать в метку времени, и имеет тип string. Если этот параметр указан, в метку времени преобразуется только часть, соответствующая формату. |

## Возвращаемое значение {#return-value}
В зависимости от входных данных возвращается значение одного из двух типов:

1. Если входное значение date_or_date_expr имеет тип datetime с ненулевым масштабом или указан параметр формата:
   Возвращается метка времени типа Decimal с точностью до шести знаков после запятой

2. Если входное значение date_or_date_expr имеет масштаб 0 и параметр формата не указан:
   Возвращается метка времени типа INT

Преобразует входное время в соответствующую метку времени, при этом за начало отсчёта принимается 1970-01-01 00:00:00.

- Возвращает null, если хотя бы один параметр равен null.
- Возвращает ошибку, если формат некорректен

## Примеры {#examples}

```sql
-- Input datetime is the begin datetime
mysql> select unix_timestamp('1970-01-01 00:00:00');
+---------------------------------------+
| unix_timestamp('1970-01-01 00:00:00') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+

-- Display timestamp of current time
mysql> select unix_timestamp();
+------------------+
| unix_timestamp() |
+------------------+
|       1753933330 |
+------------------+

-- Input a datetime to display its timestamp
mysql> select unix_timestamp('2007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('2007-11-30 10:30:19') |
+---------------------------------------+
|                            1196389819 |
+---------------------------------------+


-- Match format to display timestamp for given datetime
mysql> select unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s');
+------------------------------------------------------------+
| unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s') |
+------------------------------------------------------------+
|                                          1196389819.000000 |
+------------------------------------------------------------+

-- Input with non-zero scale
mysql> SELECT UNIX_TIMESTAMP('2015-11-13 10:20:19.123');
+-------------------------------------------+
| UNIX_TIMESTAMP('2015-11-13 10:20:19.123') |
+-------------------------------------------+
|                            1447381219.123 |
+-------------------------------------------+

-- For datetime before 1970-01-01, returns 0
select unix_timestamp('1007-11-30 10:30:19');
+---------------------------------------+
| unix_timestamp('1007-11-30 10:30:19') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+

-- Returns NULL if any parameter is null
mysql> select unix_timestamp(NULL);
+----------------------+
| unix_timestamp(NULL) |
+----------------------+
|                 NULL |
+----------------------+

-- Returns an error if format is invalid
mysql> select unix_timestamp('2007-11-30 10:30-19', 's');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation unix_timestamp of 2007-11-30 10:30-19, s is invalid
```
