---
{
    "title": "YEAR_OF_WEEK",
    "language": "ru",
    "description": "Функция YEAROFWEEK возвращает недельный год (год, к которому относится неделя) для указанной даты в соответствии со стандартом недельного календаря ISO 8601."
}
---

## Описание {#description}

Функция YEAR_OF_WEEK возвращает недельный год (год, к которому относится неделя) для указанной даты в соответствии со стандартом недельного календаря ISO 8601. В отличие от обычных календарных лет, годы в недельном календаре ISO определяются целыми неделями: первой неделей года считается неделя, содержащая 4 января, причём в ней должно быть не менее 4 дней, относящихся к этому году.

В отличие от [функции year](./year), которая просто возвращает год входной даты, YEAR_OF_WEEK следует стандарту недельного календаря ISO.

Подробнее см. в статье [Недельная дата ISO](https://en.wikipedia.org/wiki/ISO_week_date).

## Псевдоним {#alias}

- `YOW`

## Синтаксис {#syntax}

```sql
YEAR_OF_WEEK(`<date_or_time_expr>`)
YOW(`<date_or_time_expr>`)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Входное значение даты и времени; поддерживаются типы DATE/DATETIME/TIMESTAMP_NS. Сведения о форматах даты и времени, а также даты см. в разделах [Преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)|

## Возвращаемое значение {#return-value}

Возвращает значение типа SMALLINT, представляющее недельный год, вычисленный в соответствии со стандартом недельного календаря ISO 8601.

- Диапазон возвращаемых значений обычно составляет 1-9999
- Если входное значение равно NULL, возвращает NULL
- Если входное значение имеет тип DATETIME, учитывается только дата, а время игнорируется

## Примеры {#examples}

```sql
-- 2005-01-01 is Saturday, this week starts from 2004-12-27, contains more days in 2004, belongs to 2004
SELECT YEAR_OF_WEEK('2005-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2004 |
+------------+

-- Using alias YOW, same result
SELECT YOW('2005-01-01') AS yow_alias_result;
+------------------+
| yow_alias_result |
+------------------+
|             2004 |
+------------------+

-- 2005-01-03 is Monday, this week (2005-01-03 to 2005-01-09) is the first week of 2005
SELECT YEAR_OF_WEEK('2005-01-03') AS yow_result;
+------------+
| yow_result |
+------------+
|       2005 |
+------------+

-- 2023-01-01 is Sunday, this week starts from 2022-12-26, belongs to the last week of 2022
SELECT YEAR_OF_WEEK('2023-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2022 |
+------------+

-- 2023-01-02 is Monday, this week (2023-01-02 to 2023-01-08) is the first week of 2023
SELECT YEAR_OF_WEEK('2023-01-02') AS yow_result;
+------------+
| yow_result |
+------------+
|       2023 |
+------------+

-- DATETIME type input, ignoring time part
SELECT YEAR_OF_WEEK('2005-01-01 15:30:45') AS yow_datetime;
+--------------+
| yow_datetime |
+--------------+
|         2004 |
+--------------+

-- Cross-year boundary case: 2024-12-30 is Monday, belongs to the first week of 2025
SELECT YEAR_OF_WEEK('2024-12-30') AS yow_result;
+------------+
| yow_result |
+------------+
|       2025 |
+------------+

-- Input is NULL, returns NULL
SELECT YEAR_OF_WEEK(NULL) AS yow_null;
+----------+
| yow_null |
+----------+
|     NULL |
+----------+
```
