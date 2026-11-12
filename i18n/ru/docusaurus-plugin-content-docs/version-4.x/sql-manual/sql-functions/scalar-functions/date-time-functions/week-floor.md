---
{
    "title": "WEEK_FLOOR",
    "language": "ru",
    "description": "Функция WEEKFLOOR округляет входное значение даты и времени вниз до ближайшего начала интервала заданной длительности с единицей измерения WEEK."
}
---

## Описание {#description}

Функция WEEK_FLOOR округляет входное значение даты и времени вниз до ближайшего начала интервала заданной длительности с единицей измерения WEEK. Если задана исходная точка отсчёта (origin), интервалы рассчитываются относительно неё; в противном случае по умолчанию используется точка отсчёта 0001-01-01 00:00:00.

Формула расчёта даты:
$$
\text{WEEK\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$ обозначает число периодов от времени отсчёта до целевого времени.

## Синтаксис {#syntax}

```sql
WEEK_FLOOR(<date_or_time_expr>)
WEEK_FLOOR(<date_or_time_expr>, <origin>)
WEEK_FLOOR(<date_or_time_expr>, <period>)
WEEK_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## Параметры {#parameters}

| Параметр | Описание |
|-----------|-------------|
| `<date_or_time_expr>` | Значение даты и времени для округления вниз; поддерживаются типы date/datetime/timestamptz. Значение типа Date преобразуется во время начала соответствующей даты, 00:00:00. Подробнее о форматах см. в разделе [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), а о форматах datetime/date см. в разделах [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<period>` | Длительность интервала в неделях, значение типа INT, определяющее число недель в каждом интервале |
| `<origin>` | Точка отсчёта для интервалов; поддерживаются типы date/datetime; по умолчанию используется 0001-01-01 00:00:00 |

## Возвращаемое значение {#return-value}

Возвращает значение типа TIMESTAMPTZ, DATETIME или DATE, представляющее округлённые вниз дату и время. Время в результате определяется параметром origin.

- Если входное значение отлично от NULL, а `<period>` неположителен (≤0), функция возвращает ошибку;
- Если какой-либо параметр равен NULL, возвращается NULL;
- Если `<datetime>` точно совпадает с началом интервала (определяемым параметрами `<period>` и `<origin>`), возвращается это начало интервала;
- Если входное значение имеет тип date, возвращается значение типа date
- Если входное значение имеет тип datetime, возвращается значение типа datetime с тем же временем, что и у точки отсчёта.
- Если дата и время `<origin>` позже `<date_or_time_expr>`, расчёт всё равно выполняется по приведённой выше формуле, но число периодов k будет отрицательным.
- Если у `date_or_time_expr` задана точность дробной части, результат сохраняет соответствующую точность. Если `origin` содержит доли секунды, границы интервалов сохраняют эту дробную часть. В ветке Doris 4.1 начиная с версии 4.1.5 при сравнении с границами недель учитываются микросекунды, что исправляет округление в случаях, когда входное значение и `origin` отличаются только долями секунды.
- Если входное значение имеет тип TIMESTAMPTZ, оно сначала преобразуется в local_time (например, `2025-12-31 23:59:59+05:00` соответствует local_time `2026-01-01 02:59:59`, если переменная сеанса имеет значение `+08:00`), после чего выполняется вычисление FLOOR.
- Если среди входных значений времени (`<date_or_time_expr>` и `<origin>`) присутствуют оба типа, TIMESTAMPTZ и DATETIME, результат имеет тип DATETIME.

<a id="examples"></a>

## Пример {#example}

```sql
-- 2023-07-13 is Thursday, default 1-week interval (starting Monday), rounds down to nearest Monday (2023-07-10)
SELECT WEEK_FLOOR(cast('2023-07-13 22:28:18' as datetime)) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- Specify 2-week interval, rounds down to nearest 2-week interval start
SELECT WEEK_FLOOR('2023-07-13 22:28:18', 2) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- input with decimal part
SELECT WEEK_FLOOR('2023-07-13 22:28:18.123', 2) AS result;
```

```text
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-10 00:00:00.000 |
+-------------------------+
```

```sql
-- Input date type, returns date type
SELECT WEEK_FLOOR(cast('2023-07-13' as date)) AS result;
```

```text
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+
```

```sql
-- Only with origin date and specified date
select week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00");
```

```text
+----------------------------------------------------------+
| week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+----------------------------------------------------------+
| 2023-07-08 12:00:00                                      |
+----------------------------------------------------------+
```

```sql
-- Specify origin='2023-07-03' (Monday), 1-week interval
SELECT WEEK_FLOOR('2023-07-13', 1, '2023-07-03') AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_FLOOR
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00');
```

```text
+-----------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2025-12-29 00:00:00+08:00               |
+-----------------------------------------+
```

```sql
-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
```

```text
+--------------------------------------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2025-12-29 00:00:00.123                                            |
+--------------------------------------------------------------------+
```

```sql
-- Invalid period, returns error
SELECT WEEK_FLOOR('2023-07-13', 0) AS result;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_floor of 2023-07-13 00:00:00, 0 out of range
```

```sql
-- Parameter is NULL
SELECT WEEK_FLOOR(NULL, 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

Входное значение, точно совпадающее с границей интервала, остаётся без изменений:

```sql
SELECT WEEK_FLOOR('2023-07-10 00:00:00', 2);
```

```text
2023-07-10 00:00:00
```

Границы недель при точке отсчёта с микросекундной точностью (исправлено в ветке Doris 4.1 начиная с версии 4.1.5):

```sql
SELECT WEEK_FLOOR(CAST('2024-01-08 00:00:00.400000' AS DATETIME(6)),
                   1, CAST('2024-01-01 00:00:00.500000' AS DATETIME(6)));
```

```text
2024-01-01 00:00:00.500000
```
