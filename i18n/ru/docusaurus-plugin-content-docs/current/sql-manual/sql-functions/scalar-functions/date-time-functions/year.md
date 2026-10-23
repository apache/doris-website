---
{
    "title": "YEAR",
    "language": "ru",
    "description": "Функция YEAR извлекает год из указанного значения даты или времени и возвращает его как целое число."
}
---

## Описание {#description}
Функция YEAR извлекает год из указанного значения даты или времени и возвращает его как целое число. Она поддерживает обработку значений типов DATE, DATETIME и TIMESTAMP_NS.

Поведение этой функции соответствует поведению [функции year](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_year) в MySQL.

## Синтаксис {#syntax}
```sql
YEAR(`<date_or_time_expr>`)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Значение даты и времени, из которого извлекается год; поддерживаются типы DATE/DATETIME/TIMESTAMP_NS. Сведения о форматах даты и времени см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает год из значения типа DATE/DATETIME/TIMESTAMP_NS как значение типа INT в диапазоне от 0 до 9999.

- Если входной параметр равен NULL, возвращает NULL

## Примеры {#examples}

```sql
-- Extract year from DATE type
SELECT YEAR('1987-01-01') AS year_date;
+-----------+
| year_date |
+-----------+
|      1987 |
+-----------+

-- Extract year from DATETIME type (ignoring hours, minutes, seconds)
SELECT YEAR('2024-05-20 14:30:25') AS year_datetime;
+---------------+
| year_datetime |
+---------------+
|          2024 |
+---------------+

-- Input is NULL (returns NULL)
SELECT YEAR(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```
