---
{
    "title": "ARRAY_AGG",
    "language": "ru",
    "description": "Объединяет значения столбца (включая значения NULL) в массив, который можно использовать для преобразования строк в столбцы."
}
---

## Описание {#description}

Объединяет значения столбца (включая значения NULL) в массив, который можно использовать для преобразования строк в столбцы.

## Синтаксис {#syntax}

```sql
ARRAY_AGG(<col>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<col>` | Выражение, определяющее значения, которые будут помещены в массив. Поддерживаемые типы: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, Timestamptz, IPV4, IPV6, UUID, String, Array, Map, Struct. |

## Возвращаемое значение {#return-value}

Возвращает значение типа ARRAY. Особые случаи:

- Порядок элементов в массиве не гарантируется.
- Возвращает массив, полученный в результате преобразования. Тип элементов массива соответствует типу col.


## Пример {#example}

```sql
-- setup
CREATE TABLE test_doris_array_agg (
	c1 INT,
	c2 INT
) DISTRIBUTED BY HASH(c1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_doris_array_agg VALUES (1, 10), (1, 20), (1, 30), (2, 100), (2, 200), (3, NULL);
```

```sql
select c1, array_agg(c2) from test_doris_array_agg group by c1;
```

```text
+------+---------------+
| c1   | array_agg(c2) |
+------+---------------+
|    1 | [10, 20, 30]  |
|    2 | [100, 200]    |
|    3 | [null]        |
+------+---------------+
```

```sql
select array_agg(c2) from test_doris_array_agg where c1 is null;
```

```text
+---------------+
| array_agg(c2) |
+---------------+
| []            |
+---------------+
```
