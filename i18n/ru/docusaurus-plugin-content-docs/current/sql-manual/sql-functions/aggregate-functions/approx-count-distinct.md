---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "ru",
    "description": "Возвращает количество уникальных элементов, не равных NULL. Эта функция реализована на основе алгоритма HyperLogLog,"
}
---

## Описание {#description}

Возвращает количество уникальных элементов, не равных NULL.
Эта функция реализована на основе алгоритма HyperLogLog, который использует фиксированный объём памяти для оценки кардинальности столбца. Алгоритм основан на предположении о нулевом распределении в хвостах, а его точность зависит от распределения данных. При фиксированном размере бакетов, используемом в Doris, относительная стандартная ошибка алгоритма составляет 0.8125%.
Более подробный анализ приведён в [соответствующей статье](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)

## Синтаксис {#syntax}

```sql
APPROX_COUNT_DISTINCT(<expr>)
NDV(<expr>)
```

## Параметры {#parameters}

| Параметры | Описание |
| -- | -- |
| `<expr>` | Выражение, значение которого требуется получить. Поддерживаемые типы: String, Date, DateTime, TimestampNs, Timestamptz, IPv4, IPv6, UUID, TinyInt, Bool, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal. |

## Возвращаемое значение {#return-value}

Возвращает значение типа BIGINT.

## Пример {#example}

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_tinyint tinyint
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10),
    (1, 'banana', 20),
    (1, 'apple', 10),
    (2, 'orange', 30),
    (2, 'orange', 40),
    (2, 'grape', 50),
    (3, null, null);
```

```sql
select approx_count_distinct(k_string) from t1;
```

Тип String: вычисление приблизительного количества уникальных значений k_string. Значения NULL в расчёте не учитываются.

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               4 |
+---------------------------------+
```

```sql
select approx_count_distinct(k_tinyint) from t1;
```

Тип TinyInt: вычисление приблизительного количества уникальных значений k_tinyint.

```text
+----------------------------------+
| approx_count_distinct(k_tinyint) |
+----------------------------------+
|                                5 |
+----------------------------------+
```

```sql
select approx_count_distinct(k1) from t1;
```

Тип Integer: вычисление приблизительного количества уникальных значений k1.

```text
+---------------------------+
| approx_count_distinct(k1) |
+---------------------------+
|                         3 |
+---------------------------+
```

```sql
select k1, approx_count_distinct(k_string) from t1 group by k1;
```

Группировка по k1 и вычисление приблизительного количества уникальных значений k_string в каждой группе. Если все записи в группе имеют значение NULL, возвращается 0.

```text
+------+---------------------------------+
| k1   | approx_count_distinct(k_string) |
+------+---------------------------------+
|    1 |                               2 |
|    2 |                               2 |
|    3 |                               0 |
+------+---------------------------------+
```

```sql
select ndv(k_string) from t1;
```

Использование псевдонима NDV даёт тот же результат, что и использование APPROX_COUNT_DISTINCT.

```text
+---------------+
| ndv(k_string) |
+---------------+
|             4 |
+---------------+
```

```sql
select approx_count_distinct(k_string) from t1 where k1 = 999;
```

Если результат запроса пуст, возвращается 0.

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
