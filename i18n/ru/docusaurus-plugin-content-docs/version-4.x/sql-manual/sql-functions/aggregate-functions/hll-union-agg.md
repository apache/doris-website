---
{
    "title": "HLL_UNION_AGG",
    "language": "ru",
    "description": "Агрегатная функция HLLUNIONAGG в основном используется для объединения нескольких структур данных HyperLogLog и приблизительной оценки кардинальности "
}
---

## Описание {#description}

Агрегатная функция HLL_UNION_AGG в основном используется для объединения нескольких структур данных HyperLogLog и приблизительной оценки кардинальности после объединения.

## Синтаксис {#syntax}

```sql
hll_union_agg(<hll>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<hll>` | Вычисляемое выражение. Поддерживается тип HLL. |

## Возвращаемое значение {#return-value}

Возвращает значение кардинальности типа BIGINT.
Если в группе нет допустимых данных, возвращает 0.

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
select HLL_UNION_AGG(HLL_HASH(uv_set)) from test_uv;
```

```text
+---------------------------------+
| HLL_UNION_AGG(HLL_HASH(uv_set)) |
+---------------------------------+
|                               4 |
+---------------------------------+
```

```sql
select HLL_UNION_AGG(HLL_HASH(uv_set)) from test_uv where uv_set is null;
```

```text
+---------------------------------+
| HLL_UNION_AGG(HLL_HASH(uv_set)) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
