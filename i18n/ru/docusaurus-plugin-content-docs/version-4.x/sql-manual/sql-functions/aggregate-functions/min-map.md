---
{
    "title": "MIN_MAP",
    "language": "ru",
    "description": "Функция MIN_MAP агрегирует значения MAP по ключам и возвращает минимальное значение для каждого ключа."
}
---

## Описание {#description}

Функция MIN_MAP агрегирует значения MAP по ключам и возвращает MAP, содержащий минимальное значение, отличное от NULL, для каждого ключа.

## Примечания по использованию {#usage-notes}

Порядок элементов в возвращаемом MAP не гарантируется. Используйте `map_keys`, `map_values`, `array_sort` и `array_sortby`, если требуется стабильный порядок вывода. Ключ NULL агрегируется как обычный ключ; всем ключам NULL соответствует одна запись в результате.

## Синтаксис {#syntax}

```sql
MIN_MAP(<map_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<map_expr>` | Выражение типа MAP. Тип значений MAP должен допускать сравнение в агрегатной функции MIN. |

## Возвращаемое значение {#return-value}

Возвращает MAP с тем же типом ключей, что и у `<map_expr>`. Если значения имеют тип DecimalV2, типом возвращаемых значений будет соответствующий тип DecimalV3. Для остальных типов значений тип возвращаемых значений совпадает с типом значений входного MAP.

Если в группе нет ни одной допустимой входной строки, возвращается пустой MAP. Если ключ присутствует, но все соответствующие ему значения равны NULL, значением для этого ключа будет NULL.

## Пример {#example}

```sql
-- setup
CREATE TABLE map_agg_example (
    id INT,
    m MAP<INT, INT>,
    ms MAP<INT, STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO map_agg_example VALUES
    (1, MAP(1, 10, 2, 20), MAP(1, 'b', 2, 'x')),
    (1, MAP(2, 5, 3, 30), MAP(1, 'a', 3, NULL)),
    (2, MAP(1, 7, 4, NULL), MAP(2, 'z')),
    (2, CAST(MAP() AS MAP<INT, INT>), CAST(MAP() AS MAP<INT, STRING>));
```

```text
Query OK
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, MIN_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-------------+
| id   | keys      | values      |
+------+-----------+-------------+
|    1 | [1, 2, 3] | [10, 5, 30] |
|    2 | [1, 4]    | [7, null]   |
+------+-----------+-------------+
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, MIN_MAP(ms) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+----------------+
| id   | keys      | values         |
+------+-----------+----------------+
|    1 | [1, 2, 3] | ["a", "x", null] |
|    2 | [2]       | ["z"]          |
+------+-----------+----------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT MIN_MAP(m) AS result
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
