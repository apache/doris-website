---
{
    "title": "TO_ISO8601 | Функции даты и времени",
    "language": "ru",
    "description": "Преобразует значения DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ в строки в формате ISO8601.",
    "sidebar_label": "TO_ISO8601"
}
---

# TO_ISO8601 {#to_iso8601}

## Описание {#description}

Преобразует значения `DATE`, `DATETIME`, `TIMESTAMP_NS` или `TIMESTAMPTZ` в строки в формате ISO8601.
Дата и время в возвращаемой строке формата ISO8601 представлены как YYYY-MM-DDTHH:MM:SS, где T служит разделителем даты и времени.

## Синтаксис {#syntax}

```sql
TO_ISO8601(`<date_or_date_expr>`)
```

## Параметры {#parameters}
| Параметр | Описание |
|-----------|-------------|
| `<date_or_date_expr>` | Входное значение даты и времени; поддерживаются типы DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ. Подробнее о форматах см. [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает строку типа VARCHAR с датой и временем в формате ISO8601.

- Если входное значение имеет тип DATE (например, '2023-10-05'), возвращается строка в формате YYYY-MM-DD (только дата);
- Если входное значение имеет тип DATETIME (например, '2023-10-05 15:30:25'), возвращается строка в формате YYYY-MM-DDTHH:MM:SS.xxxxxx (дата и время разделены символом T, xxxxxx состоит из нулей, дробные секунды во входном значении даты и времени округляются до секунд);
- Если входное значение имеет тип TIMESTAMP_NS, возвращается строка в формате YYYY-MM-DDTHH:MM:SS.nnnnnnnnn с сохранением всех девяти цифр дробной части секунды;
- Если входное значение имеет тип TIMESTAMPTZ (например, '2023-10-05 15:30:25+03:00'), возвращается строка в формате YYYY-MM-DDTHH:MM:SS.xxxxxx±HH:MM (смещение отражает значение переменной сеанса `time_zone` после преобразования в local_time);
- Если входное значение равно NULL, возвращается NULL;

## Примеры {#examples}

```sql
-- Convert DATE type (date only)
SELECT TO_ISO8601(CAST('2023-10-05' AS DATE)) AS date_result;
+--------------+
| date_result  |
+--------------+
| 2023-10-05   |
+--------------+

-- Convert DATETIME type (with hours, minutes, seconds)
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:45.000000 |
+----------------------------+

-- Input with fractional seconds, rounded to seconds
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45.956' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:46.000000 |
+----------------------------+

-- Input TIMESTAMPTZ, SET time_zone = '+08:00'
SELECT TO_ISO8601('2025-10-10 11:22:33+03:00');
+-----------------------------------------+
| TO_ISO8601('2025-10-10 11:22:33+03:00') |
+-----------------------------------------+
| 2025-10-10T16:22:33.000000+08:00        |
+-----------------------------------------+

-- Invalid date (returns NULL)
SELECT TO_ISO8601('2023-02-30') AS invalid_date;
+--------------+
| invalid_date |
+--------------+
| NULL         |
+--------------+

-- Input is NULL (returns NULL)
SELECT TO_ISO8601(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```
