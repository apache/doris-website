---
{
    "title": "HLL_CARDINALITY",
    "language": "ru",
    "description": "HLLCARDINALITY вычисляет кардинальность значения типа HyperLogLog (HLL)."
}
---

## Описание {#description}

`HLL_CARDINALITY` вычисляет кардинальность значения типа HyperLogLog (HLL). Это алгоритм приближённого подсчёта, подходящий для оценки количества уникальных элементов в больших наборах данных.

## Синтаксис {#syntax}

```sql
HLL_CARDINALITY(<hll>)
```

## Параметры {#parameters}

| Параметр   | Описание                                                 |
| ---------- | -------------------------------------------------------- |
| `<hll>`    | Значение типа HLL, представляющее набор данных, кардинальность которого необходимо оценить. |

## Возвращаемое значение {#return-value}

Возвращает оценку кардинальности значения типа HLL, то есть количества уникальных элементов в наборе данных.

## Пример {#example}

<!-- setup-sql
CREATE TABLE test_uv (id INT, uv_set HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_uv VALUES (1, hll_hash('a')), (1, hll_hash('b')), (1, hll_hash('c'));
-->

```sql
select HLL_CARDINALITY(uv_set) from test_uv;
```

```text
+---------------------------+
| hll_cardinality(`uv_set`) |
+---------------------------+
|                         3 |
+---------------------------+
```
