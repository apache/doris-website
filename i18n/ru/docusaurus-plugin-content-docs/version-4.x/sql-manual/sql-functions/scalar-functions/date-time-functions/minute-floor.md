---
{
    "title": "MINUTE_FLOOR",
    "language": "ru",
    "description": "Функция MINUTE_FLOOR округляет входное значение даты и времени вниз до ближайшей границы заданного интервала в минутах. Если указан origin, он используется в качестве точки отсчёта; в противном случае точкой отсчёта по умолчанию служит 0001-01-01 00:00:00. Поддерживает обработку типа DATETIME."
}
---

## Описание {#description}

Функция MINUTE_FLOOR округляет входное значение даты и времени вниз до ближайшей границы заданного интервала в минутах. Если указан origin, он используется в качестве точки отсчёта; в противном случае точкой отсчёта по умолчанию служит 0001-01-01 00:00:00. Функция поддерживает обработку типа DATETIME.

Формула вычисления даты:
$$
\begin{aligned}
&\text{minute\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество интервалов от точки отсчёта до целевого времени.

## Синтаксис {#syntax}

```sql
MINUTE_FLOOR(`<datetime>`)
MINUTE_FLOOR(`<datetime>`, `<origin>`)
MINUTE_FLOOR(`<datetime>`, `<period>`)
MINUTE_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<datetime>` | Значение даты и времени, которое требуется округлить вниз. Поддерживаются входные значения типов date/datetime/timestamptz. Подробнее о форматах см. [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Величина интервала в минутах, имеющая тип INT и задающая количество минут в каждом интервале. |
| `<origin>` | Начальная точка отсчёта интервала, имеющая тип DATETIME. Значение по умолчанию: 0001-01-01 00:00:00. |

## Возвращаемое значение {#return-value}

Возвращает значение типа TIMESTAMPTZ, DATETIME или DATE. Возвращаемое значение представляет собой результат округления входной даты и времени вниз до ближайшей границы заданного интервала в минутах. Точность возвращаемого значения совпадает с точностью входного параметра datetime.

- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, когда переменная сеанса имеет значение `+08:00`), после чего выполняется вычисление MINUTE_FLOOR.
- Если входные значения времени (`<date_or_time_expr>` и `<period>`) содержат одновременно типы TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.
- Если `<period>` является неположительным числом (≤0), возвращается ошибка.
- Если любой из параметров равен NULL, возвращается NULL.
- Если period не указан, по умолчанию используется интервал в 1 минуту.
- Если `<origin>` не указан, по умолчанию в качестве точки отсчёта используется 0001-01-01 00:00:00.
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если дата и время `<origin>` позже `<period>`, вычисление по-прежнему выполняется по приведённой выше формуле, но число интервалов k будет отрицательным.
- Если у `date_or_time_expr` задано число знаков после десятичной точки, результат сохранит это число знаков, а дробная часть будет равна нулю.

## Примеры {#examples}

```sql
-- Using default period of one minute and default origin time 0001-01-01 00:00:00
SELECT MINUTE_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:00 |
+---------------------+

-- Using five minutes as one period, rounding down with default origin point
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.123', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MINUTE_FLOOR('2023-07-13 22:25:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- Only with origin date and specified date
select minute_floor("2023-07-13 22:28:18", "2023-07-01 12:21:23");
+------------------------------------------------------------+
| minute_floor("2023-07-13 22:28:18", "2023-07-01 12:21:23") |
+------------------------------------------------------------+
| 2023-07-13 22:27:23                                        |
+------------------------------------------------------------+

-- Specifying origin time
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:25:00 |
+---------------------+

-- Datetime with scale, all decimal places are truncated to 0
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTE_FLOOR('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MINUTE_FLOOR
SELECT MINUTE_FLOOR('2025-12-31 23:59:59+05:00');
+-------------------------------------------+
| MINUTE_FLOOR('2025-12-31 23:59:59+05:00') |
+-------------------------------------------+
| 2026-01-01 02:59:00+08:00                 |
+-------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT MINUTE_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+----------------------------------------------------------------------+
| MINUTE_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+----------------------------------------------------------------------+
| 2026-01-01 02:59:00.123                                              |
+----------------------------------------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MINUTE_FLOOR('0001-01-01 12:32:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 0001-01-01 12:30:00 |
+---------------------+

-- Period is non-positive, returns error
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MINUTE_FLOOR(NULL, 5), MINUTE_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+------------------------+--------+
| minute_floor(NULL, 5)  | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
