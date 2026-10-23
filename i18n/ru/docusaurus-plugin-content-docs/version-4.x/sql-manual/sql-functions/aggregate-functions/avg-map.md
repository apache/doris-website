---
{
    "title": "AVG_MAP",
    "language": "ru",
    "description": "Функция AVG_MAP агрегирует значения MAP по ключам и возвращает среднее значение для каждого ключа."
}
---

## Описание {#description}

Функция AVG_MAP агрегирует значения MAP по ключам и возвращает MAP, содержащий среднее значение для каждого ключа, вычисленное по значениям, отличным от NULL.

## Примечания по использованию {#usage-notes}

Порядок элементов в возвращаемом MAP не гарантируется. Если требуется стабильный порядок вывода, используйте `map_keys`, `map_values`, `array_sort` и `array_sortby`. Ключ NULL обрабатывается при агрегации как обычный ключ; все ключи NULL относятся к одному элементу результата.

## Синтаксис {#syntax}

```sql
AVG_MAP(<map_expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<map_expr>` | Выражение типа MAP. Тип значений MAP должен быть числовым. |

## Возвращаемое значение {#return-value}

Возвращает MAP с тем же типом ключей, что и у `<map_expr>`. Для числовых типов значений, отличных от Decimal, возвращаемые значения имеют тип DOUBLE. Для типов значений Decimal возвращаемые значения имеют тип Decimal с максимальной поддерживаемой точностью и масштабом, скорректированным для AVG.

Если в группе нет ни одной допустимой входной строки, возвращает пустой MAP. Если ключ присутствует, но все значения для него равны NULL, значение этого ключа в результате равно NULL.

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
    SELECT id, AVG_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+----------------+
| id   | keys      | values         |
+------+-----------+----------------+
|    1 | [1, 2, 3] | [10, 12.5, 30] |
|    2 | [1, 4]    | [7, null]      |
+------+-----------+----------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT AVG_MAP(md) AS result
    FROM map_agg_example
) t;
```

```text
+-----------------+------------------------+
| keys            | values                 |
+-----------------+------------------------+
| ["a", "b", "c"] | [1.2000, 3.0000, 4.7500] |
+-----------------+------------------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT AVG_MAP(m) AS result
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
