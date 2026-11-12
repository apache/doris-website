---
{
    "title": "MONTH_FLOOR",
    "language": "ru",
    "description": "Функция monthfloor округляет входное значение даты и времени вниз до ближайшей границы заданного интервала в месяцах. Если указан origin,"
}
---

## Описание {#description}

Функция month_floor округляет входное значение даты и времени вниз до ближайшей границы заданного интервала в месяцах. Если указан origin, он используется как точка отсчёта; в противном случае по умолчанию используется 0001-01-01 00:00:00.

Формула расчёта даты:
$$
\begin{aligned}
&\text{month\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает число периодов от точки отсчёта до целевого момента времени.

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
| `<datetime>` | Значение даты и времени для округления вниз. Поддерживаются типы DATETIME/DATE/TIMESTAMP_NS/TIMESTAMPTZ. Значение типа Date преобразуется в начало соответствующей даты со временем 00:00:00. Подробнее о форматах см. в разделе [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), а о форматах datetime/date — в разделах [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Значение интервала в месяцах типа INT, задающее число месяцев в каждом интервале. |
| `<origin>` | Начальная точка интервала. Поддерживаются типы `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. Значение по умолчанию: 0001-01-01 00:00:00. |

## Возвращаемое значение {#return-value}

Для входного значения типа `TIMESTAMP_NS` возвращается `TIMESTAMP_NS` с фиксированной точностью дробной части секунды до девяти знаков. Результаты проверяются на соответствие диапазону возвращаемого типа; для `TIMESTAMP_NS` используется диапазон `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

Если `<origin>` не указан для входного значения типа `TIMESTAMP_NS`, документированная точка отсчёта по умолчанию используется только как внутренний ориентир для выравнивания; она не обязана находиться в диапазоне значений, допускающих хранение в `TIMESTAMP_NS`.

Возвращается значение временного типа, выбранного на основе входных аргументов, после округления вниз до ближайшей границы заданного интервала в месяцах. Время устанавливается в 00:00:00, а день — в 01.

- Если `<period>` — неположительное число (≤0), возвращается ошибка.
- Если любой из параметров равен NULL, возвращается NULL.
- Если period не указан, по умолчанию используется интервал в 1 месяц.
- Если `<origin>` не указан, по умолчанию в качестве точки отсчёта используется 0001-01-01 00:00:00.
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его время по умолчанию равно 00:00:00.
- Если дата и время `<origin>` находятся позже `<period>`, вычисление всё равно выполняется по приведённой выше формуле, но период k будет отрицательным.
- Если date_or_time_expr имеет дробную часть, возвращаемый результат также будет иметь дробную часть с тем же числом знаков, равную нулю.
- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например: `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, когда переменная сеанса равна `+08:00`), после чего выполняется вычисление FLOOR.
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
