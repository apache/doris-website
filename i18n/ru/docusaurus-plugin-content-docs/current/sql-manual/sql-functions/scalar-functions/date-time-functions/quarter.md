---
{
    "title": "QUARTER",
    "language": "ru",
    "description": "Функция возвращает номер квартала (от 1 до 4), к которому относится указанная дата. Каждый квартал включает три месяца:"
}
---

## Описание {#description}

Функция возвращает номер квартала (от 1 до 4), к которому относится указанная дата. Каждый квартал включает три месяца:
- Квартал 1: с января по март
- Квартал 2: с апреля по июнь
- Квартал 3: с июля по сентябрь
- Квартал 4: с октября по декабрь

Поведение этой функции соответствует [функции quarter](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_quarter) в MySQL.

## Синтаксис {#syntax}

```sql
QUARTER(`<date_or_time_expr>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Входное значение даты или даты и времени. Поддерживаются типы DATE/DATETIME/TIMESTAMP_NS. Подробнее о форматах даты и времени и даты см. в разделах [Преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |

## Возвращаемое значение {#return-value}

- Возвращает значение типа TINYINT, представляющее номер квартала, к которому относится входная дата, в диапазоне от 1 до 4.
- Если входное значение равно NULL, функция возвращает NULL.

## Примеры {#examples}

```sql
-- Quarter 1 (January-March)
SELECT QUARTER('2025-01-16') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Including time component (does not affect result)
SELECT QUARTER('2025-01-16 01:11:10') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Quarter 2 (April-June)
SELECT QUARTER('2023-05-20') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

-- Quarter 3 (July-September)
SELECT QUARTER('2024-09-30 23:59:59') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

-- Quarter 4 (October-December)
SELECT QUARTER('2022-12-01') AS result;
+--------+
| result |
+--------+
|      4 |
+--------+

-- Input is NULL (returns NULL)
SELECT QUARTER(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
