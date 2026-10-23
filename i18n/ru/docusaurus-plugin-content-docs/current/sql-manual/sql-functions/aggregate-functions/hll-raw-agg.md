---
{
    "title": "HLL_RAW_AGG",
    "language": "ru",
    "description": "Функция HLLRAWAGG является агрегатной функцией и используется главным образом для объединения нескольких структур данных HyperLogLog в одну."
}
---

## Описание {#description}

Функция HLL_RAW_AGG является агрегатной функцией и используется главным образом для объединения нескольких структур данных HyperLogLog в одну.

## Псевдоним {#alias}

- HLL_UNION

## Синтаксис {#syntax}

```sql
HLL_RAW_AGG(<hll>)
HLL_UNION(<hll>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<hll>` | Вычисляемое выражение. Поддерживается тип HLL. |

## Возвращаемое значение {#return-value}

Возвращает агрегированное значение типа HLL.
Если в группе нет допустимых данных, возвращает HLL_EMPTY.

## Пример {#example}

```sql
-- setup
create table test_uv(
    id int,
    uv_set string
) distributed by hash(id) buckets 1
properties ("replication_num"="1");
insert into test_uv values
    (1, ('a')),
    (1, ('b')),
    (2, ('c')),
    (2, ('d')),
    (3, null);
```

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              4 |
+------------------------------------------------+
```

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv where uv_set is null;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              0 |
+------------------------------------------------+
```
