---
{
    "title": "COUNT_MAP",
    "language": "ru",
    "description": "Функция COUNT_MAP агрегирует значения MAP по ключам и возвращает количество значений, отличных от NULL, для каждого ключа."
}
---

## Описание {#description}

Функция COUNT_MAP агрегирует значения MAP по ключам и возвращает MAP, содержащий количество значений, отличных от NULL, для каждого ключа.

## Примечания по использованию {#usage-notes}

Порядок элементов в возвращаемом MAP не гарантируется. Используйте `map_keys`, `map_values`, `array_sort` и `array_sortby`, если требуется стабильный порядок вывода. Ключ NULL агрегируется как обычный ключ; все ключи NULL относятся к одному элементу результата.

## Синтаксис {#syntax}

```sql
COUNT_MAP(<map_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<map_expr>` | Выражение типа MAP. |

## Возвращаемое значение {#return-value}

Возвращает MAP с тем же типом ключа, что и у `<map_expr>`, и значениями типа BIGINT.

Если в группе нет ни одной допустимой входной строки, возвращает пустой MAP. Если ключ присутствует, но все значения для него равны NULL, значение для этого ключа равно 0.

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
    SELECT id, COUNT_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-----------+
| id   | keys      | values    |
+------+-----------+-----------+
|    1 | [1, 2, 3] | [1, 2, 1] |
|    2 | [1, 4]    | [1, 0]    |
+------+-----------+-----------+
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, COUNT_MAP(ms) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-----------+
| id   | keys      | values    |
+------+-----------+-----------+
|    1 | [1, 2, 3] | [2, 1, 0] |
|    2 | [2]       | [1]       |
+------+-----------+-----------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT COUNT_MAP(m) AS result
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
