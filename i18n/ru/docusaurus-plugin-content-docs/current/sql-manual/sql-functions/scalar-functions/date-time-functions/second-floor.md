---
{
    "title": "SECOND_FLOOR",
    "language": "ru",
    "description": "SECOND_FLOOR округляет значение DATE, DATETIME, TIMESTAMP_NS или TIMESTAMPTZ вниз до ближайшей границы заданного интервала в секундах."
}
---

## Описание {#description}

SECOND_FLOOR округляет значение `DATE`, `DATETIME`, `TIMESTAMP_NS` или `TIMESTAMPTZ` вниз до ближайшей границы заданного интервала в секундах. Если указан origin, он используется как точка отсчёта; в противном случае по умолчанию используется 0001-01-01 00:00:00.

Формула вычисления даты:
$$
\begin{aligned}
&\text{second\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество периодов от базового времени до целевого времени.

## Синтаксис {#syntax}

```sql
SECOND_FLOOR(<datetime>[, <period>][, <origin_datetime>])
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<datetime>` | Обязательный. Входное значение даты и времени. Поддерживаются входные значения типов DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ. Подробнее о форматах см. [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Необязательный. Задаёт количество секунд в каждом периоде. Поддерживаются положительные целые числа типа INT. По умолчанию — 1 секунда. |
| `<origin_datetime>` | Необязательный. Начальная точка выравнивания. Поддерживаются `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. Если не указан, по умолчанию используется 0001-01-01T00:00:00. |

## Возвращаемое значение {#return-value}

Для входного значения типа `TIMESTAMP_NS` возвращается `TIMESTAMP_NS` с фиксированной точностью дробной части секунды в девять знаков. Результаты проверяются на соответствие диапазону возвращаемого типа; для `TIMESTAMP_NS` используется диапазон `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

Если `<origin>` не указан для входного значения типа `TIMESTAMP_NS`, описанная в документации точка отсчёта по умолчанию используется только как внутренний ориентир для выравнивания; она не обязана находиться в диапазоне значений, которые можно хранить в `TIMESTAMP_NS`.

Возвращает значение типа TIMESTAMPTZ, TIMESTAMP_NS, DATETIME или DATE. Возвращаемое значение времени получается округлением входного значения даты и времени вниз до ближайшей границы заданного интервала в секундах. Точность возвращаемого значения совпадает с точностью входного параметра даты и времени.

- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, если переменная сеанса имеет значение `+08:00`), а затем выполняется вычисление SECOND_FLOOR.
- Если входные значения времени (`<datetime>` и `<period>`) содержат одновременно типы TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.
- Если `<period>` неположителен (≤0), возвращается ошибка.
- Если любой параметр равен NULL, возвращается NULL.
- Если период не указан, по умолчанию используется период длительностью 1 секунду.
- Если `<origin_datetime>` не указан, в качестве точки отсчёта по умолчанию используется 0001-01-01 00:00:00.
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Для значений даты и времени с дробной частью все знаки после запятой заменяются на 0.
- Если дата и время `<origin>` находятся после `<period>`, вычисление по-прежнему выполняется по приведённой выше формуле, но число периодов k будет отрицательным.

## Примеры {#examples}

```sql
-- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_FLOOR('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 5-second period, downward rounding result with default starting point
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:55 |
+---------------------+

-- Only with origin date and specified date
select second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123");
+----------------------------------------------------------------+
| second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123") |
+----------------------------------------------------------------+
| 2023-07-13 22:28:17.123                                        |
+----------------------------------------------------------------+

-- Specify starting time (origin)
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_FLOOR('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:34:55.000000 |
+----------------------------+

-- Input is DATE type (default time 00:00:00)
SELECT SECOND_FLOOR('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform SECOND_FLOOR
SELECT SECOND_FLOOR('2025-12-31 23:59:59+05:00');
+-------------------------------------------+
| SECOND_FLOOR('2025-12-31 23:59:59+05:00') |
+-------------------------------------------+
| 2026-01-01 02:59:00+08:00                 |
+-------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT SECOND_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+----------------------------------------------------------------------+
| SECOND_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+----------------------------------------------------------------------+
| 2026-01-01 02:59:00.123                                              |
+----------------------------------------------------------------------+

-- Period is non-positive, returns error
mysql> SELECT SECOND_FLOOR('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_floor of 2025-01-23 12:34:56, -3 out of range

-- Any parameter is NULL, returns NULL
SELECT SECOND_FLOOR(NULL, 5), SECOND_FLOOR('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| second_floor(NULL, 5)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+
```
