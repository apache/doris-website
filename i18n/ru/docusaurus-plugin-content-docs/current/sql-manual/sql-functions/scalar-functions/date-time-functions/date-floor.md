---
{
    "title": "DATE_FLOOR",
    "language": "ru",
    "description": "Функция datefloor округляет указанное значение даты или времени вниз до ближайшего начала заданного временного интервала."
}
---

## Описание {#description}

Функция date_floor округляет указанное значение даты или времени вниз до ближайшего начала заданного временного интервала. Она поддерживает входные значения типов `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. Период задаётся параметрами period (количество единиц) и type (единица измерения); расчёт ведётся от фиксированной начальной точки 0001-01-01 00:00:00.

Формула расчёта даты:
$$
\begin{aligned}
&\text{date\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{type}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество периодов, необходимых для достижения целевого времени от базового времени.

$type$ обозначает единицу измерения периода

## Синтаксис {#syntax}

`DATE_FLOOR(<datetime>, INTERVAL <period> <type>)`

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `date_or_time_expr` | Допустимое выражение даты. Поддерживаются `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`. Подробнее о форматах см. в разделах [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `period` | Задаёт количество единиц в каждом периоде, имеет тип `INT`. Начальная точка отсчёта: 0001-01-01T00:00:00 |
| `type` | Допустимые значения: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND |

## Возвращаемое значение {#return-value}

Для входного значения типа `TIMESTAMP_NS` возвращается значение `TIMESTAMP_NS` с фиксированной точностью дробной части секунды в девять знаков. Результаты проверяются на соответствие диапазону возвращаемого типа; для `TIMESTAMP_NS` используется диапазон `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

Если `<origin>` не указан для входного значения типа `TIMESTAMP_NS`, документированная начальная точка по умолчанию используется только как внутренняя точка отсчёта для выравнивания; она не обязательно должна находиться в диапазоне значений, доступных для хранения в `TIMESTAMP_NS`.

Возвращаемый тип: TIMESTAMPTZ, TIMESTAMP_NS, DATETIME или DATE. Возвращается результат округления даты вниз в соответствии с периодом, с тем же типом, что и у `<date_or_time_expr>`.

Результат округления вниз соответствует типу `<date_or_time_expr>`:
- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` представляет local_time `2026-01-01 02:59:59`, если значение переменной сеанса равно `+08:00`), затем выполняется вычисление DATE_FLOOR.
- Если входное значение имеет тип DATE, возвращается DATE (только дата);
- Если входное значение имеет тип DATETIME, возвращается DATETIME (дата и время).
- Если входное значение имеет тип TIMESTAMP_NS, возвращается TIMESTAMP_NS с девятью знаками в дробной части секунды.
- Если входное значение имеет тип TIMESTAMPTZ, возвращается TIMESTAMPTZ (дата, время и смещение).
- Если входное значение содержит дробную часть секунд, возвращаемое значение сохраняет её точность, а сама дробная часть равна нулю.

Особые случаи:
- Возвращается NULL, если какой-либо параметр равен NULL;
- При недопустимом значении period (неположительное целое число) или type возвращается ошибка;

## Примеры {#examples}

```sql
-- Floor down to the nearest 5-second interval (period starts at 00, 05, 10... seconds)
mysql> select date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND);
+------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND) |
+------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                             |
+------------------------------------------------------------------------+

-- Date time with scale will return value with scale
mysql> select date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND);
+----------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND) |
+----------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                                 |
+----------------------------------------------------------------------------+

-- The input time is exactly the start of a 5-day period
mysql> select date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY);
+---------------------------------------------------+
| date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY) |
+---------------------------------------------------+
| 2023-07-10 00:00:00                               |
+---------------------------------------------------+

-- Floor down for date type
mysql> select date_floor("2023-07-13", INTERVAL 5 YEAR);
+-------------------------------------------+
| date_floor("2023-07-13", INTERVAL 5 YEAR) |
+-------------------------------------------+
| 2021-01-01 00:00:00                       |
+-------------------------------------------+

-- TimeStampTz type example, SET time_zone = '+08:00'
-- Convert variable value to local_time(2026-01-01 02:59:59) then perform DATE_FLOOR operation
SELECT DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR);
+----------------------------------------------------------+
| DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR) |
+----------------------------------------------------------+
| 2026-01-01 00:00:00+08:00                                |
+----------------------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 HOUR, '2025-12-15 00:00:00.123') AS result;

-- period is negative, invalid returns error
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL -5 MINUTE);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5, 0001-01-01 00:00:00 out of range

-- Unsupported type
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 MILLISECOND);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'MILLISECOND' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 52)

-- Any parameter is NULL
mysql> select date_floor(NULL, INTERVAL 5 HOUR);
+-----------------------------------+
| date_floor(NULL, INTERVAL 5 HOUR) |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

-- Floor down every 5 weeks
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK);
+----------------------------------------------------+
| date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK) |
+----------------------------------------------------+
| 2023-07-10 00:00:00                                |
+----------------------------------------------------+

```
