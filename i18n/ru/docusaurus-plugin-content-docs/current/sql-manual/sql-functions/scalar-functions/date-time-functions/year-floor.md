---
{
    "title": "YEAR_FLOOR",
    "language": "ru",
    "description": "Функция yearfloor округляет входное значение даты и времени вниз до ближайшего начала интервала указанной длительности в годах. Если задан origin,"
}
---

## Описание {#description}

Функция year_floor округляет входное значение даты и времени вниз до ближайшего начала интервала указанной длительности в годах. Если задан origin, он используется как точка отсчёта; в противном случае по умолчанию используется 0000-01-01 00:00:00.

Формула вычисления даты:
$$
\begin{aligned}
&\text{year\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество периодов от точки отсчёта до целевого момента времени.

## Синтаксис {#syntax}
```sql
YEAR_FLOOR(<date_or_time_expr>)
YEAR_FLOOR(<date_or_time_expr>, origin)
YEAR_FLOOR(<date_or_time_expr>, <period>)
YEAR_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## Параметры {#parameters}
| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Значение даты и времени для округления вниз. Поддерживаются типы DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ. Значение типа DATE преобразуется в начало соответствующей даты со временем 00:00:00. Подробные сведения о форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Необязательный параметр, определяющий количество лет в каждом периоде. Поддерживаются положительные целые числа (INT). Значение по умолчанию: 1 год. |
| `<origin_datetime>` | Начальная точка интервала. Поддерживаются типы DATE/DATETIME/TIMESTAMP_NS; значение по умолчанию: 0000-01-01 00:00:00. |

## Возвращаемое значение {#return-value}

Для входного значения типа `TIMESTAMP_NS` возвращается значение `TIMESTAMP_NS` с фиксированной точностью до девяти знаков в дробной части секунды. Результаты проверяются на соответствие диапазону возвращаемого типа; для `TIMESTAMP_NS` используется диапазон `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

Если `<origin>` не задан для входного значения типа `TIMESTAMP_NS`, документированное значение origin по умолчанию используется только как внутренняя точка отсчёта для выравнивания; оно не обязано входить в диапазон значений, допустимых для хранения в `TIMESTAMP_NS`.
Возвращает результат того же типа, что и входное значение (TIMESTAMPTZ, TIMESTAMP_NS, DATETIME или DATE), соответствующий началу годового интервала после округления вниз:

- Если входное значение имеет тип DATE, возвращается значение типа DATE (содержащее только дату); если входное значение имеет тип DATETIME или является строкой в корректном формате, возвращается значение типа DATETIME (время соответствует origin; если origin не задан, по умолчанию используется 00:00:00).
- Если `<period>` является неположительным целым числом (≤0), функция возвращает ошибку.
- Если любой из параметров равен NULL, возвращается NULL.
- Если `<date_or_time_expr>` точно совпадает с началом интервала (определяемого параметрами `<period>` и `<origin>`), возвращается это начало интервала.
- Если результат вычисления превышает максимальную дату и время 9999-12-31 23:59:59, возвращается ошибка.
- Если дата и время `<origin>` находятся позже `<period>`, вычисление по-прежнему выполняется по приведённой выше формуле, но число периодов k будет отрицательным.
- Если для date_or_time_expr задана точность дробной части, результат также будет иметь эту точность, а его дробная часть будет равна нулю.
- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59` при значении переменной сеанса `+08:00`), после чего выполняется вычисление FLOOR.
- Если среди входных значений времени (`<date_or_time_expr>` и `<period>`) есть значения обоих типов, TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.

## Примеры {#examples}
```sql
-- Default 1-year interval (start point is January 1st each year), 2023-07-13 rounds down to 2023-01-01
SELECT YEAR_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Specify 5-year interval, 2023-07-13 rounds down to nearest 5-year interval start (calculated with default origin)
SELECT YEAR_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-01-01 00:00:00 |  
+---------------------+

-- input with scale
mysql> SELECT YEAR_FLOOR('2023-07-13 22:28:18.123', 5) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2021-01-01 00:00:00.000 |
+-------------------------+

-- Input is DATE type, returns DATE type interval start
SELECT YEAR_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-01-01 |
+------------+

-- Only with origin date and specified date
select year_floor("2023-07-13 22:28:18", "2021-03-13 22:13:00");
+----------------------------------------------------------+
| year_floor("2023-07-13 22:28:18", "2021-03-13 22:13:00") |
+----------------------------------------------------------+
| 2023-03-13 22:13:00                                      |
+----------------------------------------------------------+

-- Specify origin reference point='2020-01-01', 1-year interval, 2023-07-13 rounds to 2023-01-01
SELECT YEAR_FLOOR('2023-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Specify origin with time part, returned result's time part matches origin
SELECT YEAR_FLOOR('2023-07-13', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- Input exactly at interval start point (origin='2023-01-01', period=1), returns itself
SELECT YEAR_FLOOR('2023-01-01', 1, '2023-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Input time earlier than origin start time, rounds down to earlier interval point
SELECT YEAR_FLOOR('2019-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2019-01-01 00:00:00 |
+---------------------+

-- Cross-multiple periods rounding down, period=3, origin='2020-01-01'
SELECT YEAR_FLOOR('2025-07-13', 3, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT YEAR_FLOOR('2023-07-13 22:22:56', 1, '2028-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- Input time part earlier than origin time part, rounds down within same year
SELECT YEAR_FLOOR('2023-07-13 06:00:00', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-01-01 08:30:00 |
+---------------------+

-- Input time part later than origin time part, normal rounding down
SELECT YEAR_FLOOR('2023-07-13 10:00:00', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform YEAR_FLOOR
SELECT YEAR_FLOOR('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| YEAR_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2026-01-01 00:00:00+08:00               |
+-----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT YEAR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| YEAR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2026-01-01 00:00:00.123                                            |
+--------------------------------------------------------------------+

-- Invalid period (non-positive integer)
SELECT YEAR_FLOOR('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_floor of 2023-07-13 00:00:00, 0 out of range

-- Any parameter is NULL, returns NULL
SELECT YEAR_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
