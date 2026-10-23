---
{
    "title": "YEAR",
    "language": "ru",
    "description": "Функция YEAR извлекает год из указанного значения даты или времени и возвращает его в виде целого числа."
}
---

## Описание {#description}
Функция YEAR извлекает год из указанного значения даты или времени и возвращает его в виде целого числа. Она поддерживает обработку значений типов DATE и DATETIME.

Поведение этой функции соответствует поведению [функции year](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_year) в MySQL.

## Синтаксис {#syntax}
```sql
YEAR(`<date_or_time_expr>`)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Значение даты и времени, из которого извлекается год. Поддерживаются типы date/datetime. Форматы datetime и date описаны в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает год из значения типа date/datetime. Тип результата: INT, диапазон значений: 0-9999.

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
