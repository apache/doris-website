---
{
    "title": "MONTH_CEIL",
    "language": "ru",
    "description": "Функция monthceil округляет входное значение даты и времени вверх до ближайшей границы заданного интервала в месяцах. Если указан origin,"
}
---

## Описание {#description}


Функция month_ceil округляет входное значение даты и времени вверх до ближайшей границы заданного интервала в месяцах. Если указан origin, он используется как точка отсчёта; в противном случае по умолчанию используется 0001-01-01 00:00:00.

Формула вычисления даты:
$$
\begin{aligned}
&\text{month\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество периодов, необходимых для достижения целевого времени от точки отсчёта.

## Синтаксис {#syntax}

```sql
MONTH_CEIL(`<date_or_time_expr>`)
MONTH_CEIL(`<date_or_time_expr>`, `<origin>`)
MONTH_CEIL(`<date_or_time_expr>`, `<period>`)
MONTH_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Значение даты и времени, которое нужно округлить вверх. Допустимое выражение даты, поддерживающее типы date/datetime/timestamptz. Значение типа Date преобразуется в начало соответствующей даты со временем 00:00:00. Подробнее о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Значение интервала в месяцах типа INT, задающее количество месяцев в каждом интервале. |
| `<origin>` | Начальный момент времени интервала. Поддерживает типы date/datetime. Значение по умолчанию: 0001-01-01 00:00:00. |

## Возвращаемое значение {#return-value}

Возвращает значение типа DATETIME, представляющее результат округления входного значения даты и времени вверх до ближайшей границы заданного интервала в месяцах. Время в результате устанавливается в 00:00:00, а день месяца усекается до 01.

- Если `<period>` — неположительное число (≤0), возвращается ошибка.
- Если любой параметр равен NULL, возвращается NULL.
- Если period не указан, по умолчанию используется интервал в 1 месяц.
- Если `<origin>` не указан, по умолчанию точкой отсчёта служит 0001-01-01 00:00:00.
- Если входное значение имеет тип DATE (время по умолчанию 00:00:00).
- Если результат вычисления превышает верхнюю границу диапазона дат 9999-12-31 23:59:59, возвращается ошибка.
- Если дата и время `<origin>` позднее `<period>`, вычисление по-прежнему выполняется по приведённой выше формуле, но число периодов k будет отрицательным.
- Если у date_or_time_expr задана точность дробной части, возвращаемый результат также будет иметь эту точность, а дробная часть будет равна нулю.
- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, когда переменная сеанса равна `+08:00`), после чего выполняется вычисление CEIL.
- Если входные значения времени (`<date_or_time_expr>` и `<period>`) содержат одновременно типы TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.

## Примеры {#examples}

```sql
-- Using default period of 1 month and default origin time 0001-01-01 00:00:00
SELECT MONTH_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-08-01 00:00:00 |
+---------------------+

-- Using 5 months as one period, rounding up with default origin point
SELECT MONTH_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-12-01 00:00:00 |
+---------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MONTH_CEIL('2023-12-01 00:00:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-12-01 00:00:00        |
+----------------------------+

-- Only with origin date and specified date
select month_ceil("2023-07-13 22:28:18", "2022-07-04 00:00:00");
+----------------------------------------------------------+
| month_ceil("2023-07-13 22:28:18", "2022-07-04 00:00:00") |
+----------------------------------------------------------+
| 2023-08-04 00:00:00                                      |
+----------------------------------------------------------+

-- Specifying origin time
SELECT MONTH_CEIL('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-11-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MONTH_CEIL('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-02-03 22:20:00 |
+---------------------+

-- Datetime with scale, time component and decimal places are all truncated to 0
SELECT MONTH_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-12-01 00:00:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_CEIL('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-01 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MONTH_CEIL
SELECT MONTH_CEIL('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| MONTH_CEIL('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2026-02-01 00:00:00+08:00               |
+-----------------------------------------+

-- If the input time values contain both TIMESTAMPTZ and DATETIME types, the output is DATETIME type.
SELECT MONTH_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| MONTH_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2026-01-15 00:00:00.123                                            |
+--------------------------------------------------------------------+

-- Calculation result exceeds maximum date range 9999-12-31, returns error
SELECT MONTH_CEIL('9999-12-13 22:28:18', 5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_ceil of 9999-12-13 22:28:18, 5 out of range

-- Period is non-positive, returns error
SELECT MONTH_CEIL('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_ceil of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MONTH_CEIL(NULL, 5), MONTH_CEIL('2023-07-13 22:28:18', NULL) AS result;
+----------------------+--------+
| month_ceil(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+
```
