---
{
    "title": "MINUTE_CEIL",
    "language": "ru",
    "description": "MINUTE_CEIL округляет значение DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ вверх до ближайшей границы указанного интервала в минутах."
}
---

## Описание {#description}


MINUTE_CEIL округляет значение типа `DATE`, `DATETIME`, `TIMESTAMP_NS` или `TIMESTAMPTZ` вверх до ближайшей границы указанного интервала в минутах. Если задан origin, он используется как точка отсчёта; иначе по умолчанию используется 0001-01-01 00:00:00.

Формула вычисления даты:
$$
\begin{aligned}
&\text{minute\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество интервалов, необходимых для перехода от базового времени к целевому времени.

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
| `<date_or_time_expr>` | Значение даты и времени для округления вверх. Поддерживаются входные значения типов DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ. Подробнее о форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Длительность интервала в минутах, значение типа INT, указывающее количество минут в каждом интервале. |
| `<origin>` | Начальная точка отсчёта интервала. Поддерживаются типы `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. Значение по умолчанию: 0001-01-01 00:00:00. |

## Возвращаемое значение {#return-value}

Для входного значения `TIMESTAMP_NS` возвращается `TIMESTAMP_NS` с фиксированной точностью дробной части секунды до девяти знаков. Результаты проверяются на соответствие диапазону возвращаемого типа; для `TIMESTAMP_NS` используется диапазон `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

Если `<origin>` не указан для входного значения `TIMESTAMP_NS`, описанная точка отсчёта по умолчанию используется только как внутренняя опорная точка для выравнивания; ей не обязательно находиться в диапазоне значений, допустимых для хранения в `TIMESTAMP_NS`.

Возвращает значение типа TIMESTAMPTZ, TIMESTAMP_NS, DATETIME или DATE. Возвращает значение времени после округления входной даты и времени вверх до ближайшей границы указанного интервала в минутах. Точность возвращаемого значения совпадает с точностью входного параметра даты и времени.

- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59` при значении переменной сеанса `+08:00`), затем выполняется вычисление MINUTE_CEIL.
- Если входные значения времени (`<date_or_time_expr>` и `<period>`) содержат одновременно типы TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.
- Если `<period>` — неположительное число (≤0), возвращается ошибка.
- Если какой-либо параметр равен NULL, возвращается NULL.
- Если period не указан, по умолчанию используется интервал в 1 минуту.
- Если `<origin>` не указан, по умолчанию в качестве базовой точки отсчёта используется 0001-01-01 00:00:00.
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если результат вычисления превышает максимальную дату и время 9999-12-31 23:59:59, возвращается ошибка.
- Если дата и время `<origin>` позже `<period>`, вычисление всё равно выполняется по приведённой выше формуле, но число периодов k будет отрицательным.
- Если у `date_or_time_expr` задана точность дробной части, она сохраняется в результате, а дробная часть будет равна нулю.

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
