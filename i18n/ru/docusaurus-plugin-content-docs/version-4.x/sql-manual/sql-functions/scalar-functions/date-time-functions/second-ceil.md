---
{
    "title": "SECOND_CEIL",
    "language": "ru",
    "description": "Функция SECOND_CEIL округляет входное значение даты и времени вверх до ближайшей границы указанного периода в секундах. Если задан origin, он используется как точка отсчёта; если не задан, точкой отсчёта по умолчанию служит 0001-01-01 00:00:00. Поддерживает обработку типа DATETIME."
}
---

## Описание {#description}


Функция SECOND_CEIL округляет входное значение даты и времени вверх до ближайшей границы указанного периода в секундах. Если задан origin, он используется как точка отсчёта; в противном случае по умолчанию используется 0001-01-01 00:00:00. Функция поддерживает обработку типа DATETIME.

Формула расчёта даты:
$$
\begin{aligned}
&\text{second\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество периодов, необходимых для достижения целевого времени от точки отсчёта.

## Синтаксис {#syntax}

```sql
SECOND_CEIL(<datetime>[, <period>][, <origin_datetime>])
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<datetime>` | Обязательный. Входное значение даты и времени. Поддерживаются входные значения типов date/datetime/timestamptz. Подробнее о допустимых форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Необязательный. Указывает количество секунд в каждом периоде. Поддерживаются положительные целые значения типа INT. По умолчанию — 1 секунда. |
| `<origin_datetime>` | Необязательный. Начальная точка выравнивания. Поддерживаются входные значения типа datetime и строки, соответствующие форматам datetime. Если не задан, по умолчанию используется 0001-01-01T00:00:00. |

## Возвращаемое значение {#return-value}

Возвращает значение типа TIMESTAMPTZ, DATETIME или DATE. Возвращаемое значение времени получается округлением входной даты и времени вверх до ближайшей границы указанного периода в секундах. Точность возвращаемого значения совпадает с точностью входного параметра datetime.

- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, когда переменная сеанса имеет значение `+08:00`), после чего выполняется вычисление SECOND_CEIL.
- Если входные значения времени (`<datetime>` и `<period>`) содержат одновременно типы TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.
- Если `<period>` — неположительное целое число (≤0), возвращается ошибка.
- Если хотя бы один параметр равен NULL, возвращается NULL.
- Если period не задан, по умолчанию используется период длительностью 1 секунду.
- Если `<origin>` не задан, точкой отсчёта по умолчанию служит 0001-01-01 00:00:00.
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если результат вычисления выходит за допустимый диапазон типа DATETIME (от 0000-01-01 00:00:00 до 9999-12-31 23:59:59.999999), возвращается ошибка.
- Для datetime с дробной частью её значение усекается до 0.
- Если дата и время `<origin>` позже `<period>`, вычисление всё равно выполняется по приведённой выше формуле, но число периодов k будет отрицательным.

## Примеры {#examples}

```sql
-- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_CEIL('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 5-second period, upward rounding result with default starting point
SELECT SECOND_CEIL('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- Only with origin date and specified date
select second_ceil("2023-07-13 22:28:18", "2023-07-13 22:13:12.123");
+---------------------------------------------------------------+
| second_ceil("2023-07-13 22:28:18", "2023-07-13 22:13:12.123") |
+---------------------------------------------------------------+
| 2023-07-13 22:28:18.123                                       |
+---------------------------------------------------------------+

-- Specify starting time (origin)
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_CEIL('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:35:00.000000 |
+----------------------------+

-- Input is DATE type (default time 00:00:00)
SELECT SECOND_CEIL('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform SECOND_CEIL
SELECT SECOND_CEIL('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| SECOND_CEIL('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 02:59:59+08:00                |
+------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT SECOND_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| SECOND_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2026-01-01 02:59:59.123                                             |
+---------------------------------------------------------------------+

-- Calculation result exceeds maximum datetime range, returns error
SELECT SECOND_CEIL('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 9999-12-31 23:59:59, 2 out of range

-- Period is non-positive, returns error
mysql> SELECT SECOND_CEIL('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 2025-01-23 12:34:56, -3 out of range

-- Any parameter is NULL, returns NULL
SELECT SECOND_CEIL(NULL, 5), SECOND_CEIL('2025-01-23 12:34:56', NULL) AS result;
+------------------------+--------+
| second_ceil(NULL, 5)   | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
