---
{
    "title": "YEAR_CEIL",
    "language": "ru",
    "description": "Функция yearceil округляет входное значение даты и времени вверх до ближайшего начала заданного интервала, измеряемого в годах."
}
---

## Описание {#description}


Функция year_ceil округляет входное значение даты и времени вверх до ближайшего начала заданного интервала, измеряемого в годах. Если указан origin, он используется как точка отсчёта; в противном случае по умолчанию используется 0000-01-01 00:00:00.

Формула вычисления даты:
$$
\begin{aligned}
&\text{year\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество периодов, необходимых для достижения целевого времени от точки отсчёта.

## Синтаксис {#syntax}
```sql
YEAR_CEIL(<date_or_time_expr>)
YEAR_CEIL(<date_or_time_expr>, origin)
YEAR_CEIL(<date_or_time_expr>, <period>)
YEAR_CEIL(<date_or_time_expr>, <period>, <origin>)
```
## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Значение даты и времени для округления вверх. Поддерживаются типы date/datetime/timestamptz. Значение типа date преобразуется во время начала соответствующей даты: 00:00:00. Подробнее о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Необязательный параметр, задающий количество лет в каждом периоде. Поддерживаются положительные целые числа (INT). По умолчанию используется 1 год. |
| `<origin_datetime>` | Точка отсчёта интервала. Поддерживаются типы date/datetime; по умолчанию используется 0000-01-01 00:00:00. |

## Возвращаемое значение {#return-value}

Возвращает результат того же типа, что и входное значение (DATETIME или DATE), представляющий начало годового интервала после округления вверх:

- Если входное значение имеет тип DATE, возвращается значение типа DATE (содержащее только дату); если входное значение имеет тип DATETIME или является строкой в корректном формате, возвращается значение типа DATETIME (время соответствует origin; при отсутствии origin по умолчанию используется 00:00:00).
- Если `<period>` является неположительным целым числом (≤0), функция возвращает ошибку.
- Если какой-либо параметр равен NULL, возвращается NULL.
- Если `<date_or_time_expr>` точно совпадает с началом интервала (определяемым по `<period>` и `<origin>`), возвращается это начало интервала.
- Если результат вычисления превышает максимальное значение даты и времени 9999-12-31 23:59:59, возвращается ошибка.
- Если дата и время `<origin>` находятся после `<period>`, вычисление всё равно выполняется по приведённой выше формуле, но число периодов k будет отрицательным.
- Если для date_or_time_expr задана точность дробной части, результат также будет иметь эту точность, а дробная часть будет равна нулю.
- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, когда значение переменной сеанса равно `+08:00`), а затем выполняется вычисление CEIL.
- Если входные значения времени (`<date_or_time_expr>` и `<period>`) имеют одновременно типы TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.

## Примеры {#examples}

```sql
-- Default 1-year interval (start point is January 1st each year), 2023-07-13 rounds up to 2024-01-01
SELECT YEAR_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

-- Specify 5-year interval, 2023-07-13 rounds up to nearest 5-year interval start (calculated with default origin)
SELECT YEAR_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-01 00:00:00 |  
+---------------------+

-- Input is DATE type, returns DATE type interval start
SELECT YEAR_CEIL(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2024-01-01 |
+------------+

-- Only with origin date and specified date
select year_ceil("2023-07-13 22:28:18", "2021-03-13 22:13:00");
+---------------------------------------------------------+
| year_ceil("2023-07-13 22:28:18", "2021-03-13 22:13:00") |
+---------------------------------------------------------+
| 2024-03-13 22:13:00                                     |
+---------------------------------------------------------+

-- Specify origin reference point='2020-01-01', 1-year interval, 2023-07-13 rounds to 2024-01-01
SELECT YEAR_CEIL('2023-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

-- input with scale
mysql> SELECT YEAR_CEIL('2023-07-13 22:28:18.123', 5) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2026-01-01 00:00:00.000 |
+-------------------------+

-- Specify origin with time part, returned result's time part matches origin
SELECT YEAR_CEIL('2023-07-13', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 08:30:00 |
+---------------------+

-- Input exactly at interval start point (origin='2023-01-01', period=1), returns itself
SELECT YEAR_CEIL('2023-01-01', 1, '2023-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT YEAR_CEIL('2023-07-13 22:22:56', 1, '2028-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 08:30:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform YEAR_CEIL
SELECT YEAR_CEIL('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| YEAR_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2027-01-01 00:00:00+08:00              |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT YEAR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| YEAR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2027-01-01 00:00:00.123                                           |
+-------------------------------------------------------------------+

-- Invalid period (non-positive integer)
SELECT YEAR_CEIL('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_ceil of 2023-07-13 00:00:00, 0 out of range

-- Any parameter is NULL, returns NULL
SELECT YEAR_CEIL(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Calculation result exceeds maximum datetime, returns error
SELECT YEAR_CEIL('9999-12-31 22:28:18', 5) AS result;
-- ERROR: Operation out of range
```
