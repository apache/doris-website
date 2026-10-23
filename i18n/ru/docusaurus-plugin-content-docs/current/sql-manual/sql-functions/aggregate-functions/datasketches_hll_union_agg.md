---
{
"title": "DATASKETCHES_HLL_UNION_AGG",
"language": "ru",
"description": "datasketches_hll_union_agg — агрегатная функция, которая объединяет несколько HLL-скетчей Apache DataSketches и возвращает оценку кардинальности объединения в виде значения DOUBLE."
}
---

## Описание {#description}

`datasketches_hll_union_agg` — агрегатная функция, которая **объединяет** несколько сериализованных значений скетчей Apache DataSketches **HLL** (`hll_sketch`) и возвращает **оценку кардинальности** (приблизительное количество уникальных значений / NDV) после объединения.

Функция принимает на вход **сериализованные байты HLL-скетча DataSketches** (например, полученные с помощью `hll_sketch.serialize_compact()` из библиотеки DataSketches). Произвольные строки не поддерживаются.

Псевдонимы:

- `ds_hll_estimate`
- `datasketches_hll_estimate`

## Синтаксис {#syntax}

```sql
datasketches_hll_union_agg(<sketch>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<sketch>` | Сериализованные байты HLL-скетча Apache DataSketches. Поддерживаемые типы: STRING / VARCHAR / VARBINARY. Значения NULL игнорируются. Пустые строки считаются недопустимыми входными данными и вызывают ошибку. |

## Возвращаемое значение {#return-value}

Возвращает оценку кардинальности типа DOUBLE (Float64).  
Если в группе нет корректных данных (или входные данные пусты), возвращает 0.  
Если входные байты невозможно десериализовать в корректный HLL-скетч DataSketches (в том числе в случае пустой строки), возникает ошибка (обычно с кодом ошибки `CORRUPTION`).

## Пример {#example}

```sql
-- setup
CREATE TABLE test_datasketches_hll_union_agg_tbl (
    id INT,
    sk STRING
)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- The sketch bytes are inserted via Base64 decoding.
INSERT INTO test_datasketches_hll_union_agg_tbl VALUES
    (1, from_base64('AgEHCAMIBwjL18IEK/L7BoYv+Q11gWYHgbxdBntl5gj8LUIK')),
    (2, from_base64('AwEHCAUIAAkKAAAAIjvrBcS1nwfGGWoEyHokBO8t9wc1qTEENkcJB7hWqQxZf9QNnuSbGA==')),
    (3, NULL);
```

```sql
-- The function returns DOUBLE, so use ROUND/CAST if you want an integer display.
SELECT CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT)
FROM test_datasketches_hll_union_agg_tbl;
```

```text
+-------------------------------------------------------+
| CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT) |
+-------------------------------------------------------+
|                                                    17 |
+-------------------------------------------------------+
```

```sql
-- aliases
SELECT
    CAST(ROUND(datasketches_hll_union_agg(sk)) AS BIGINT) AS v1,
    CAST(ROUND(ds_hll_estimate(sk)) AS BIGINT)            AS v2,
    CAST(ROUND(datasketches_hll_estimate(sk)) AS BIGINT)  AS v3
FROM test_datasketches_hll_union_agg_tbl;
```

```text
+------+------+------+
| v1   | v2   | v3   |
+------+------+------+
|   17 |   17 |   17 |
+------+------+------+
```

```sql
-- empty input returns 0
SELECT datasketches_hll_union_agg(sk)
FROM test_datasketches_hll_union_agg_tbl
WHERE sk IS NULL;
```

```text
+--------------------------------+
| datasketches_hll_union_agg(sk) |
+--------------------------------+
|                              0 |
+--------------------------------+
```

```sql
-- invalid sketch bytes will throw
SELECT datasketches_hll_union_agg(from_base64('AA=='));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CORRUPTION]HLL sketch data corrupted when add: Attempt to deserialize unknown object type
```

```sql
-- empty string is invalid and will throw
SELECT datasketches_hll_union_agg('');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CORRUPTION]HLL sketch data corrupted when add: empty input.
```
