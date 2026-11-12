---
{
    "title": "MONTH",
    "language": "ru",
    "description": "Функция MONTH извлекает номер месяца из значения даты и времени. Возвращаемое значение находится в диапазоне от 1 до 12 и соответствует одному из 12 месяцев года."
}
---

## Описание {#description}

Функция MONTH извлекает номер месяца из значения даты и времени. Возвращаемое значение находится в диапазоне от 1 до 12 и соответствует одному из 12 месяцев года. Функция поддерживает обработку типов DATE, DATETIME и TIMESTAMP_NS.

Эта функция работает так же, как [функция month](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_month) в MySQL, при использовании MONTH в качестве единицы измерения.

## Синтаксис {#syntax}

```sql
MONTH(`<date_or_time_expr>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Входное значение даты и времени. Поддерживаются типы DATE/DATETIME/TIMESTAMP_NS. Сведения о конкретных форматах значений даты и времени и дат см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |

## Возвращаемое значение {#return-value}

Возвращает значение типа TINYINT, представляющее номер месяца:
- Диапазон: от 1 до 12
- 1 соответствует январю, 12 соответствует декабрю
- Если входное значение равно NULL, возвращается NULL

## Примеры {#examples}

```sql
-- Extract month from DATE type
SELECT MONTH('1987-01-01') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Extract month from DATETIME type
SELECT MONTH('2023-07-13 22:28:18') AS result;
+--------+
| result |
+--------+
|      7 |
+--------+

-- Extract month from DATETIME with fractional seconds
SELECT MONTH('2023-12-05 10:15:30.456789') AS result;
+--------+
| result |
+--------+
|     12 |
+--------+

-- Returns NULL when input is NULL
SELECT MONTH(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
