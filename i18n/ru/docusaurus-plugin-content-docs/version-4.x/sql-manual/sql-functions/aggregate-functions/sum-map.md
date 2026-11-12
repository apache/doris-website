---
{
    "title": "SUM_MAP",
    "language": "ru",
    "description": "Функция SUM_MAP агрегирует значения MAP по ключам и возвращает сумму значений для каждого ключа."
}
---

## Описание {#description}

Функция SUM_MAP агрегирует значения MAP по ключам и возвращает MAP с суммой значений, отличных от NULL, для каждого ключа.

## Примечания по использованию {#usage-notes}

Порядок записей в возвращаемом MAP не гарантируется. Если требуется стабильный порядок вывода, используйте `map_keys`, `map_values`, `array_sort` и `array_sortby`. Ключ NULL агрегируется как обычный ключ; все ключи NULL относятся к одной записи результата.

## Синтаксис {#syntax}

```sql
SUM_MAP(<map_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<map_expr>` | Выражение типа MAP. Тип значений MAP должен быть числовым. |

## Возвращаемое значение {#return-value}

Возвращает MAP с тем же типом ключей, что и у `<map_expr>`. Для целочисленных типов значений, а также Boolean и NULL возвращаемые значения имеют тип BIGINT. Для типов значений Float и Double возвращаемые значения имеют тип DOUBLE. Для типа значений Decimal возвращаемые значения имеют тип Decimal с максимальной поддерживаемой точностью и тем же масштабом. Для типа значений LargeInt возвращаемые значения имеют тип LargeInt.

Если в группе нет ни одной допустимой входной строки, возвращается пустой MAP. Если ключ присутствует, но все его значения равны NULL, значение этого ключа в результате будет NULL.

## Пример {#example}

```sql
-- setup
CREATE TABLE map_agg_example (
    id INT,
    m MAP<INT, INT>,
    md MAP<STRING, DECIMAL(10, 2)>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO map_agg_example VALUES
    (1, MAP(1, 10, 2, 20), MAP('a', 1.20, 'b', 2.30)),
    (1, MAP(2, 5, 3, 30), MAP('b', 3.70, 'c', 4.00)),
    (2, MAP(1, 7, 4, NULL), MAP('a', NULL, 'c', 5.50)),
    (2, CAST(MAP() AS MAP<INT, INT>), CAST(MAP() AS MAP<STRING, DECIMAL(10, 2)>));
```

```text
Query OK
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, SUM_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+--------------+
| id   | keys      | values       |
+------+-----------+--------------+
|    1 | [1, 2, 3] | [10, 25, 30] |
|    2 | [1, 4]    | [7, null]    |
+------+-----------+--------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT SUM_MAP(md) AS result
    FROM map_agg_example
) t;
```

```text
+-----------------+--------------------+
| keys            | values             |
+-----------------+--------------------+
| ["a", "b", "c"] | [1.20, 6.00, 9.50] |
+-----------------+--------------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT SUM_MAP(m) AS result
    FROM map_agg_example
    WHERE id = 100
) t;
```

```text
+------+--------+
| keys | values |
+------+--------+
| []   | []     |
+------+--------+
```
