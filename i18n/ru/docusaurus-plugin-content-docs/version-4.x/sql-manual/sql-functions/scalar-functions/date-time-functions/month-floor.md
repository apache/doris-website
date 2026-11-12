---
{
    "title": "MONTH_FLOOR",
    "language": "ru",
    "description": "Функция monthfloor округляет входное значение даты и времени вниз до ближайшей границы заданного интервала в месяцах. Если указан origin,"
}
---

## Описание {#description}

Функция month_floor округляет входное значение даты и времени вниз до ближайшей границы заданного интервала в месяцах. Если указан origin, он используется как точка отсчёта; иначе по умолчанию используется 0001-01-01 00:00:00.

Формула расчёта даты:
$$
\begin{aligned}
&\text{month\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество периодов от исходного до целевого момента времени.

## Синтаксис {#syntax}

```sql
MONTH_FLOOR(`<datetime>`)
MONTH_FLOOR(`<datetime>`, `<origin>`)
MONTH_FLOOR(`<datetime>`, `<period>`)
MONTH_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<datetime>` | Значение даты и времени для округления вниз. Поддерживаются типы DATETIME/DATE/TIMESTAMPTZ. Значение типа DATE преобразуется в начало соответствующей даты со временем 00:00:00. Подробные сведения о форматах см. в разделе [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), а о форматах datetime/date — в разделах [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Значение интервала в месяцах типа INT, указывающее количество месяцев в каждом интервале. |
| `<origin>` | Начальный момент интервала типа DATETIME или DATE. Значение по умолчанию: 0001-01-01 00:00:00. |

## Возвращаемое значение {#return-value}

Возвращает значение типа DATETIME, представляющее результат округления входной даты и времени вниз до ближайшей границы заданного интервала в месяцах. Временная часть результата устанавливается в 00:00:00, а день месяца усекается до 01.

- Если `<period>` является неположительным числом (≤0), возвращается ошибка.
- Если любой из параметров равен NULL, возвращается NULL.
- Если period не указан, по умолчанию используется интервал в 1 месяц.
- Если `<origin>` не указан, по умолчанию в качестве точки отсчёта используется 0001-01-01 00:00:00.
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если дата и время `<origin>` находятся позже `<period>`, вычисление по-прежнему выполняется по приведённой выше формуле, но номер периода k будет отрицательным.
- Если для date_or_time_expr задана точность дробной части секунд, результат сохраняет эту точность, а дробная часть будет равна нулю.
- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например: `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, когда переменная сеанса имеет значение `+08:00`), после чего выполняется вычисление FLOOR.
- Если входные значения времени (`<datetime>` и `<period>`) содержат одновременно типы TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.

## Примеры {#examples}

```sql
-- Using default period of 1 month and default origin time 0001-01-01 00:00:00
SELECT MONTH_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Using 5 months as one period, rounding down with default origin point
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MONTH_FLOOR('2023-06-01 00:00:00', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Only with origin date and specified date
 select month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00");
+-----------------------------------------------------------+
| month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-04 00:00:00                                       |
+-----------------------------------------------------------+

-- Specifying origin time
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Datetime with scale, time component and decimal places are all truncated to 0
SELECT MONTH_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-05-01 00:00:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_FLOOR('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT MONTH_FLOOR('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-09-03 22:20:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
-- Convert the variable value to local_time(2026-01-01 02:59:59) before performing the FLOOR operation
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 00:00:00+08:00                |
+------------------------------------------+

-- If the parameters include both TimeStampTz and Datetime types, output the DateTime type.
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2025-12-15 00:00:00.123                                             |
+---------------------------------------------------------------------+

-- Period is non-positive, returns error
SELECT MONTH_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MONTH_FLOOR(NULL, 5), MONTH_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| month_floor(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
