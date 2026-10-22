---
{
    "title": "MEDIAN",
    "language": "ru",
    "description": "Функция MEDIAN возвращает медиану выражения, что эквивалентно percentile(expr, 0.5)."
}
---

## Описание {#description}

Функция MEDIAN возвращает медиану выражения, что эквивалентно percentile(expr, 0.5).

## Синтаксис {#syntax}

```sql
MEDIAN(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Выражение, для которого вычисляется медиана. Поддерживаемые типы: Double, Float, LargeInt, BigInt, Int, SmallInt, TinyInt. |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа данных, что и входное выражение.
Возвращает NULL, если в группе нет допустимых данных.

## Пример {#example}

```sql
-- setup
create table log_statis(
    datetime datetime,
    scan_rows int
) distributed by hash(datetime) buckets 1
properties ("replication_num"="1");
insert into log_statis values
    ('2025-08-25 10:00:00', 10),
    ('2025-08-25 10:00:00', 50),
    ('2025-08-25 10:00:00', 100),
    ('2025-08-25 11:00:00', 20),
    ('2025-08-25 11:00:00', 30),
    ('2025-08-25 11:00:00', 40);
```

```sql
select datetime, median(scan_rows) from log_statis group by datetime;
```

```text
select datetime, median(scan_rows) from log_statis group by datetime;
+---------------------+-------------------+
| datetime            | median(scan_rows) |
+---------------------+-------------------+
| 2025-08-25 10:00:00 |                50 |
| 2025-08-25 11:00:00 |                30 |
+---------------------+-------------------+
```

```sql
select median(scan_rows) from log_statis where scan_rows is null;
```

```text
select median(scan_rows) from log_statis where scan_rows is null;
+-------------------+
| median(scan_rows) |
+-------------------+
|              NULL |
+-------------------+
```
