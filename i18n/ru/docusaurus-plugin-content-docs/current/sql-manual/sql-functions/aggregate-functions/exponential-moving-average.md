---
{
    "title": "EXPONENTIAL_MOVING_AVERAGE",
    "language": "ru",
    "description": "Вычисляет экспоненциально сглаженное скользящее среднее для значений, индексированных по времени, с заданным периодом полураспада."
}
---

## Описание {#description}

Вычисляет экспоненциально сглаженное скользящее среднее для значений, индексированных по времени. Параметр `half_decay` задаёт период полураспада: время, за которое экспоненциальный вес прошлого значения уменьшается до 1/2 исходного значения.

Экспоненциальное скользящее среднее придаёт больший вес недавним наблюдениям, причём веса экспоненциально уменьшаются с течением времени. Эта функция особенно полезна для сглаживания зашумлённых временных рядов и выявления тенденций.

Алгоритм работает следующим образом:

- Каждому значению присваивается вес `2^(-dt / half_decay)`, где `dt` обозначает разницу во времени между этим значением и последней временной точкой.
- Результат равен взвешенной сумме, делённой на сумму весов, рассчитанную для временных точек с единичным интервалом: `1 / (1 - 2^(-1 / half_decay))`.
- Функция коммутативна и ассоциативна, поэтому подходит для распределённой агрегации.

## Синтаксис {#syntax}

```sql
EXPONENTIAL_MOVING_AVERAGE(<half_decay>, <value>, <timeunit>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<half_decay>` | Период полураспада. Должен задаваться константным числовым выражением. Поддерживаемый тип: DOUBLE. |
| `<value>` | Числовой столбец, для которого вычисляется среднее. Поддерживаемый тип: DOUBLE. |
| `<timeunit>` | Числовой индекс времени (не исходная временная метка). Для преобразования столбцов с временными метками используйте `intDiv(toUnixTimestamp(ts), interval_seconds)`. Поддерживаемый тип: DOUBLE. |

## Возвращаемое значение {#return-value}

Возвращает значение типа DOUBLE, представляющее экспоненциально сглаженное скользящее среднее. Особые случаи:

- Если `half_decay` равен 0, возвращает 0.
- Если `<value>` или `<timeunit>` содержит значения NULL, соответствующие строки исключаются из расчёта.
- Если в группе нет допустимых данных, возвращает NULL.

## Пример {#example}

### Базовое использование {#basic-usage}

Вычисление экспоненциального скользящего среднего для показаний температуры с течением времени:

```sql
-- setup
create table temparature_data (
    id int,
    temp double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into temparature_data values
    (1, 10, 1),
    (2, 20, 2),
    (3, 30, 3);
```

```sql
select exponential_moving_average(2.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(2.0, temp, ts) |
+----------------------------------------------------+
|                                  14.39339828220178 |
+----------------------------------------------------+
```

### Влияние периода полураспада {#half-decay-impact}

Чем меньше half_decay, тем больший вес получают недавние значения:

```sql
-- same data as above, but with half_decay=1
select exponential_moving_average(1.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(1.0, temp, ts) |
+----------------------------------------------------+
|                                              21.25 |
+----------------------------------------------------+
```

### Использование с GROUP BY {#use-with-group-by}

```sql
-- setup
create table sensor_data (
    sensor_id int,
    reading double,
    ts double
) distributed by hash (sensor_id) buckets 1
properties ("replication_num"="1");

insert into sensor_data values
    (1, 10, 1),
    (1, 20, 2),
    (2, 100, 1),
    (2, 200, 2);
```

```sql
select sensor_id, exponential_moving_average(1.0, reading, ts)
from sensor_data group by sensor_id order by sensor_id;
```

```text
+-----------+-------------------------------------------------------+
| sensor_id | exponential_moving_average(1.0, reading, ts) |
+-----------+-------------------------------------------------------+
|         1 |                                                  12.5 |
|         2 |                                                   125 |
+-----------+-------------------------------------------------------+
```

### Обработка NULL {#null-handling}

Строки со значениями NULL исключаются из расчёта.

```sql
-- setup
create table null_test (
    id int,
    val double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into null_test values
    (1, 10, 1),
    (2, null, 2),
    (3, 20, 3);
```

```sql
select exponential_moving_average(1.0, val, ts) from null_test;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            11.25 |
+-------------------------------------------------+
```

### Пустой набор результатов {#empty-result-set}

Если набор результатов пуст, возвращает NULL.

```sql
select exponential_moving_average(1.0, val, ts) from null_test where val > 100;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            NULL |
+-------------------------------------------------+
```

### Использование в качестве оконной функции {#use-with-window-function}

```sql
-- setup
create table time_series (
    ts double,
    val double
) distributed by hash (ts) buckets 1
properties ("replication_num"="1");

insert into time_series values (0, 10), (1, 10), (2, 10);
```

```sql
select
    ts,
    exponential_moving_average(1.0, val, ts)
        over (order by ts rows between unbounded preceding and current row) as ema
from time_series order by ts;
```

```text
+------+-------+
| ts   | ema   |
+------+-------+
|    0 |     5 |
|    1 |   7.5 |
|    2 |  8.75 |
+------+-------+
```

### Требование константного значения {#constant-requirement}

Параметр `half_decay` должен быть константой. Передача выражения со ссылкой на столбец приведёт к ошибке:

```sql
-- this will cause an error: half_decay must be a constant
select exponential_moving_average(val, val, ts) from temparature_data;
```
