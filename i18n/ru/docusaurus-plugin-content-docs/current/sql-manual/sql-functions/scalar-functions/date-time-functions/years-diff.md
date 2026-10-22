---
{
    "title": "YEARS_DIFF",
    "language": "ru",
    "description": "Функция YEARSDIFF используется для вычисления разницы в полных годах между двумя значениями даты или времени,"
}
---

## Описание {#description}

Функция YEARS_DIFF используется для вычисления разницы в полных годах между двумя значениями даты или времени. Результат представляет собой количество полных лет от начального до конечного момента времени. Функция поддерживает типы DATE, DATETIME и TIMESTAMP_NS и при расчёте учитывает полную разницу во времени (включая месяцы, дни, часы, минуты и секунды).

## Синтаксис {#syntax}

```sql
YEARS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr1>` | Конечная дата; поддерживаются типы DATE/DATETIME/TIMESTAMP_NS. Подробнее о форматах даты и времени и форматах даты см. в разделах [Преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Начальная дата; поддерживаются типы DATE/DATETIME/TIMESTAMP_NS и строки, соответствующие формату даты и времени |

## Возвращаемое значение {#return-value}

Возвращает целое число типа INT, представляющее разницу в полных годах между `<date_or_time_expr1>` и `<date_or_time_expr2>`:

- Если `<date_or_time_expr1>` позже `<date_or_time_expr2>`, возвращается положительное число (должно выполняться условие «полного года»: например, разница между '2022-03-15 08:30:00' и '2021-03-15 09:10:00' фактически составляет менее полного года, поэтому возвращается 0).
- Если `<date_or_time_expr1>` раньше `<date_or_time_expr2>`, возвращается отрицательное число (расчёт выполняется так же, как описано выше, но знак результата меняется на противоположный).
- Если входное значение имеет тип DATE, его временная часть по умолчанию равна 00:00:00.
- Если любой из параметров равен NULL, возвращается NULL.
- Особый случай для февраля в високосном году (например, 2024 год является високосным: разница между 29 февраля этого года и 28 февраля 2023 года составляет полный год)

## Примеры {#examples}

```sql
-- Year difference of 1 year, and month-day equal (full year)
SELECT YEARS_DIFF('2020-12-25', '2019-12-25') AS diff_full_year;
+----------------+
| diff_full_year |
+----------------+
|              1 |
+----------------+

-- Year difference of 1 year, but end month-day earlier than start month-day (less than a year)
SELECT YEARS_DIFF('2020-11-25', '2019-12-25') AS diff_less_than_year;
+---------------------+
| diff_less_than_year |
+---------------------+
|                   0 |
+---------------------+

-- DATETIME type with time components
SELECT YEARS_DIFF('2022-03-15 08:30:00', '2021-03-15 09:10:00') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             0 |
+---------------+

-- Mixed DATE and DATETIME calculation, DATE type input defaults time part to 00:00:00
SELECT YEARS_DIFF('2024-05-20', '2020-05-20 12:00:00') AS diff_mixed;
+------------+
| diff_mixed |
+------------+
|          3 |
+------------+

-- End time earlier than start time, returns negative number
SELECT YEARS_DIFF('2018-06-10', '2020-06-10') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -2 |
+---------------+

-- Special leap year February case (2024 is a leap year, February 29th vs February 28th 2023, constitutes a full year)
SELECT YEARS_DIFF('2024-02-29', '2023-02-28') AS leap_year_diff;
+----------------+
| leap_year_diff |
+----------------+
|              1 |
+----------------+

-- Any parameter is NULL (returns NULL)
SELECT 
  YEARS_DIFF(NULL, '2023-03-15') AS null_input1,
  YEARS_DIFF('2023-03-15', NULL) AS null_input2;
+-------------+-------------+
| null_input1 | null_input2 |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```
