---
{
    "title": "HLL_FROM_BASE64",
    "language": "ru",
    "description": "Преобразует строку в кодировке base64 (обычно результат функции HLLTOBASE64) в HLL. Если входная строка некорректна или имеет значение NULL,"
}
---

## Описание {#description}

Преобразует строку в кодировке base64 (обычно результат функции `HLL_TO_BASE64`) в HLL. Если входная строка некорректна или имеет значение NULL, функция возвращает NULL.

## Синтаксис {#syntax}

```sql
HLL_FROM_BASE64(<input>)
```

## Параметры {#parameters}

| Параметр | Описание                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `<input>` | Строка в кодировке base64, обычно полученная с помощью функции `HLL_TO_BASE64`. Если входная строка некорректна или имеет значение NULL, функция возвращает NULL. |

## Примеры {#examples}

<!-- setup-sql
CREATE TABLE test_hll (id INT, pv HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_hll VALUES (1, hll_hash('a')), (2, hll_hash('b')), (3, hll_hash('c'));
-->

```sql
select hll_union_agg(hll_from_base64(hll_to_base64(pv))), hll_union_agg(pv) from test_hll;
```

```text
+---------------------------------------------------+-------------------+
| hll_union_agg(hll_from_base64(hll_to_base64(pv))) | hll_union_agg(pv) |
+---------------------------------------------------+-------------------+
|                                                 3 |                 3 |
+---------------------------------------------------+-------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc'))));
```

```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(''))));
```

```text
+---------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('')))) |
+---------------------------------------------------------------+
|                                                             1 |
+---------------------------------------------------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL))));
```

```text
+-----------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL)))) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
```
