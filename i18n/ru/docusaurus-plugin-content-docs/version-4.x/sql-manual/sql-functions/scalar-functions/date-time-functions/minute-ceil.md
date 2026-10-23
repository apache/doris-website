---
{
    "title": "MINUTE_CEIL",
    "language": "ru",
    "description": "Функция MINUTE_CEIL округляет входное значение даты и времени вверх до ближайшей границы заданного интервала в минутах. Если указан origin, он используется в качестве точки отсчёта; если он не указан, по умолчанию используется 0001-01-01 00:00:00. Поддерживает обработку типа DATETIME."
}
---

## Описание {#description}


Функция MINUTE_CEIL округляет входное значение даты и времени вверх до ближайшей границы заданного интервала в минутах. Если указан origin, он используется в качестве точки отсчёта; в противном случае по умолчанию используется 0001-01-01 00:00:00. Функция поддерживает обработку типа DATETIME.

Формула расчёта даты:
$$
\begin{aligned}
&\text{minute\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество интервалов, необходимых для перехода от исходного времени к целевому.

## Синтаксис {#syntax}

```sql
MINUTE_CEIL(`<date_or_time_expr>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<origin>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Значение даты и времени, которое требуется округлить вверх. Поддерживаются входные значения типов date/datetime/timestamptz. Подробнее о форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Значение интервала в минутах типа INT, определяющее количество минут в каждом интервале. |
| `<origin>` | Начальный момент интервала типа DATETIME. Значение по умолчанию: 0001-01-01 00:00:00. |

## Возвращаемое значение {#return-value}

Возвращает значение типа TIMESTAMPTZ, DATETIME или DATE. Возвращает время, полученное округлением входного значения даты и времени вверх до ближайшей границы заданного интервала в минутах. Точность возвращаемого значения совпадает с точностью входного параметра даты и времени.

- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, когда значение переменной сеанса равно `+08:00`), после чего выполняется вычисление MINUTE_CEIL.
- Если входные значения времени (`<date_or_time_expr>` и `<period>`) содержат одновременно типы TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.
- Если `<period>` является неположительным числом (≤0), возвращается ошибка.
- Если какой-либо параметр равен NULL, возвращается NULL.
- Если period не указан, по умолчанию используется интервал в 1 минуту.
- Если `<origin>` не указан, в качестве точки отсчёта по умолчанию используется 0001-01-01 00:00:00.
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если результат вычисления превышает максимальное значение даты и времени 9999-12-31 23:59:59, возвращается ошибка.
- Если дата и время `<origin>` позже `<period>`, расчёт по-прежнему выполняется по приведённой выше формуле, но число интервалов k будет отрицательным.
- Если у `date_or_time_expr` задан масштаб (scale), возвращаемый результат также будет иметь масштаб, а дробная часть будет нулевой.

## Примеры {#examples}

```sql
-- Using default period of one minute and default origin time 0001-01-01 00:00:00
SELECT MINUTE_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:29:00 |
+---------------------+

-- Using five minutes as one period, rounding up with default origin point
SELECT MINUTE_CEIL('2023-07-13 22:28:18.123', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MINUTE_CEIL('2023-07-13 22:30:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Only with origin date and specified date
select minute_ceil("2023-07-13 22:28:18", "2023-07-01 12:21:23");
+-----------------------------------------------------------+
| minute_ceil("2023-07-13 22:28:18", "2023-07-01 12:21:23") |
+-----------------------------------------------------------+
| 2023-07-13 22:28:23                                       |
+-----------------------------------------------------------+

-- Specifying origin time
SELECT MINUTE_CEIL('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Datetime with scale, all decimal places are truncated to 0
SELECT MINUTE_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MINUTE_CEIL('0001-01-01 12:32:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 0001-01-01 12:35:00 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTE_CEIL('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MINUTE_CEIL
SELECT MINUTE_CEIL('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MINUTE_CEIL('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 03:00:00+08:00                |
+------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT MINUTE_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MINUTE_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2026-01-01 03:00:00.123                                             |
+---------------------------------------------------------------------+

-- Calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns error
SELECT MINUTE_CEIL('9999-12-31 23:59:18', 6);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 9999-12-31 23:59:18, 6 out of range

-- Period is non-positive, returns error
SELECT MINUTE_CEIL('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MINUTE_CEIL(NULL, 5), MINUTE_CEIL('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| minute_ceil(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
