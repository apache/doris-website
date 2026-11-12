---
{
    "title": "WEEKS_DIFF",
    "language": "ru",
    "description": "Функция WEEKSDIFF вычисляет разницу в полных неделях между двумя значениями даты или времени,"
}
---

## Описание {#description}
Функция WEEKS_DIFF вычисляет разницу в полных неделях между двумя значениями даты или времени. Результат — количество недель, полученное вычитанием начального времени из конечного (7 дней считаются 1 неделей). Функция поддерживает типы DATE, DATETIME и строки в соответствующем формате, учитывая при вычислениях полную разницу во времени (включая часы, минуты и секунды).

## Синтаксис {#syntax}

```sql
WEEKS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Параметры {#parameters}
| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr1>` | Более поздняя дата или дата со временем; поддерживаются типы date/datetime. Сведения о форматах datetime и date см. в разделах [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Более ранняя дата или дата со временем; поддерживаются типы date/datetime |

## Возвращаемое значение {#return-value}

Возвращает целое число типа INT, представляющее разницу в полных неделях между `<date_or_time_expr1>` и `<date_or_time_expr2>`:

- Если `<date_or_time_expr1>` позже, чем `<date_or_time_expr2>`, возвращает положительное число (целая часть от деления общей разницы в днях на 7).
- Если `<date_or_time_expr1>` раньше, чем `<date_or_time_expr2>`, возвращает отрицательное число (тот же способ вычисления, но результат берётся с обратным знаком).
- Если входное значение имеет тип DATE, его время по умолчанию принимается равным 00:00:00.
- При вычислении учитывается полная разница во времени (включая часы, минуты и секунды). Подсчитываются только полные периоды по 7 дней, а остаток меньше недели отбрасывается.
- Если любой из параметров равен NULL, возвращает NULL.
- Подсчитываются только полные периоды по 7 дней: например, при разнице в 8 дней возвращается 1 неделя, а при разнице в 6 дней — 0 недель. Так, разница между '2023-10-08 00:00:00' и '2023-10-01 12:00:00' составляет 6.5 дня, поэтому возвращается 0 недель; разница между '2023-10-08 12:00:00' и '2023-10-01 00:00:00' составляет 7.5 дня, поэтому возвращается 1 неделя.

## Примеры {#examples}
```sql
-- Two DATE types differ by 8 weeks (56 days)
SELECT WEEKS_DIFF('2020-12-25', '2020-10-25') AS diff_date;
+-----------+
| diff_date |
+-----------+
|         8 |
+-----------+

-- DATETIME type with time portions (total 56 days difference, ignoring hour/minute/second differences)
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25 12:10:02') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             8 |
+---------------+

-- Mixed DATE and DATETIME calculation (DATE defaults to 00:00:00)
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25') AS diff_mixed;
+-------------+
| diff_mixed  |
+-------------+
|           8 |
+-------------+

-- Less than 1 week (6 days), returns 0
SELECT WEEKS_DIFF('2023-10-07', '2023-10-01') AS diff_6_days;
+-------------+
| diff_6_days |
+-------------+
|           0 |
+-------------+

-- More than 1 week (8 days), returns 1
SELECT WEEKS_DIFF('2023-10-09', '2023-10-01') AS diff_8_days;
+-------------+
| diff_8_days |
+-------------+
|           1 |
+-------------+

-- Time portion impact: 7.5 days difference (returns 1) vs 6.5 days (returns 0)
SELECT 
  WEEKS_DIFF('2023-10-08 12:00:00', '2023-10-01 00:00:00') AS diff_7_5d,
  WEEKS_DIFF('2023-10-08 00:00:00', '2023-10-01 12:00:00') AS diff_6_5d;
+-----------+-----------+
| diff_7_5d | diff_6_5d |
+-----------+-----------+
|         1 |         0 |
+-----------+-----------+

-- End time earlier than start time, returns negative number
SELECT WEEKS_DIFF('2023-10-01', '2023-10-08') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -1 |
+---------------+

-- Cross-year calculation (2023-12-25 to 2024-01-01 differs by 7 days, returns 1)
SELECT WEEKS_DIFF('2024-01-01', '2023-12-25') AS cross_year;
+------------+
| cross_year |
+------------+
|          1 |
+------------+

-- Any parameter is NULL (returns NULL)
SELECT 
  WEEKS_DIFF(NULL, '2023-10-01') AS null_input1,
  WEEKS_DIFF('2023-10-01', NULL) AS null_input2;
+-------------+-------------+
| null_input1 | null_input2 |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```
