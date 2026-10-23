---
{
    "title": "DATE_FLOOR",
    "language": "ru",
    "description": "Функция datefloor округляет заданное значение даты или времени вниз до ближайшего начала периода заданной длительности."
}
---

## Описание {#description}

Функция date_floor округляет заданное значение даты или времени вниз до ближайшего начала периода заданной длительности. Периоды определяются параметрами period (количество единиц) и type (единица измерения), а отсчёт ведётся от фиксированной начальной точки 0001-01-01 00:00:00.

Формула расчёта даты:
$$
\begin{aligned}
&\text{date\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{type}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ обозначает количество циклов, необходимых для перехода от базового времени к целевому времени.

$type$ обозначает единицу измерения периода

## Синтаксис {#syntax}

`DATE_FLOOR(<datetime>, INTERVAL <period> <type>)`

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `date_or_time_expr` | Корректное выражение даты, поддерживающее входные значения типов date/datetime/timestamptz. Подробнее о форматах см. в разделах [Преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [Преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `period` | Задаёт количество единиц в каждом периоде; имеет тип `INT`. Начальная точка отсчёта: 0001-01-01T00:00:00 |
| `type` | Допустимые значения: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND |

## Возвращаемое значение {#return-value}

Возвращаемое значение имеет тип TIMESTAMPTZ, DATETIME или DATE. Функция возвращает результат округления даты вниз в соответствии с периодом, того же типа, что и `<date_or_time_expr>`.

Тип результата округления вниз соответствует типу `<date_or_time_expr>`:
- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, когда значение переменной сеанса равно `+08:00`), затем выполняется вычисление DATE_FLOOR.
- Если входное значение имеет тип DATE, возвращается DATE (только дата);
- Если входное значение имеет тип DATETIME, возвращается DATETIME (дата и время).
- Если входное значение имеет тип TIMESTAMPTZ, возвращается TIMESTAMPTZ (дата, время и смещение).
- Для входного значения с заданной разрядностью дробной части возвращается значение с той же разрядностью и нулевой дробной частью.

Особые случаи:
- Возвращает NULL, если хотя бы один параметр равен NULL;
- Возвращает ошибку при недопустимом значении period (неположительном целом числе) или type;

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
