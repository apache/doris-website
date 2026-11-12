---
{
    "title": "HLL_TO_BASE64",
    "language": "ru",
    "description": "Преобразует входное значение HLL в строку в кодировке base64."
}
---

## Описание {#description}

Преобразует входное значение HLL в строку в кодировке base64.

## Синтаксис {#syntax}

```sql
HLL_TO_BASE64(<hll_input>)
```

## Параметры {#parameters}

| Параметр     | Описание                                             |
| ------------ | ---------------------------------------------------- |
| `<hll_input>` | Данные HyperLogLog (HLL), которые необходимо преобразовать в строку в кодировке base64. |

## Возвращаемое значение {#return-value}

Строка в кодировке Base64, представляющая HLL.
Возвращает `NULL`, если HLL имеет значение `NULL`.

::: note

Поскольку порядок элементов в HLL не гарантируется, для одного и того же содержимого могут генерироваться разные строки Base64. Однако HLL, декодированный с помощью `hll_from_base64`, будет одинаковым.

:::

## Примеры {#examples}

<!-- setup-sql
CREATE TABLE test_hll (id INT, pv HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_hll VALUES (1, hll_hash('a')), (2, hll_hash('b')), (3, hll_hash('c'));
-->

```sql
select hll_to_base64(NULL);
```

```text
+---------------------+
| hll_to_base64(NULL) |
+---------------------+
| NULL                |
+---------------------+
```

```sql
select hll_to_base64(hll_empty());
```

```text
+----------------------------+
| hll_to_base64(hll_empty()) |
+----------------------------+
| AA==                       |
+----------------------------+
```

```sql
select hll_to_base64(hll_hash('abc'));
```

```text
+--------------------------------+
| hll_to_base64(hll_hash('abc')) |
+--------------------------------+
| AQEC5XSzrpDsdw==               |
+--------------------------------+
```

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
