---
{
    "title": "MAX_MAP",
    "language": "ru",
    "description": "Функция MAX_MAP агрегирует значения MAP по ключам и возвращает максимальное значение для каждого ключа."
}
---

## Описание {#description}

Функция MAX_MAP агрегирует значения MAP по ключам и возвращает MAP, содержащий для каждого ключа максимальное из значений, отличных от NULL.

## Примечания по использованию {#usage-notes}

Порядок элементов в возвращаемом MAP не гарантируется. Если требуется стабильный порядок вывода, используйте `map_keys`, `map_values`, `array_sort` и `array_sortby`. Ключ NULL обрабатывается при агрегации как обычный ключ; все ключи NULL относятся к одному элементу результата.

## Синтаксис {#syntax}

```sql
MAX_MAP(<map_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<map_expr>` | Выражение типа MAP. Тип значений MAP должен поддерживать сравнение в агрегатной функции MAX. |

## Возвращаемое значение {#return-value}

Возвращает MAP с тем же типом ключей, что и у `<map_expr>`. Для значений типа DecimalV2 типом значений результата является соответствующий тип DecimalV3. Для остальных типов значений тип значений результата совпадает с типом значений входного MAP.

Если в группе нет ни одной допустимой входной строки, возвращает пустой MAP. Если ключ присутствует, но все его значения равны NULL, значение этого ключа в результате равно NULL.

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
    SELECT id, MAX_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+--------------+
| id   | keys      | values       |
+------+-----------+--------------+
|    1 | [1, 2, 3] | [10, 20, 30] |
|    2 | [1, 4]    | [7, null]    |
+------+-----------+--------------+
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, MAX_MAP(ms) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+----------------+
| id   | keys      | values         |
+------+-----------+----------------+
|    1 | [1, 2, 3] | ["b", "x", null] |
|    2 | [2]       | ["z"]          |
+------+-----------+----------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT MAX_MAP(m) AS result
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
