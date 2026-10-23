---
{
    "title": "COLLECT_LIST",
    "language": "ru",
    "description": "Агрегатная функция для объединения всех значений столбца в массив."
}
---

## Описание {#description}

Агрегатная функция для объединения всех значений столбца в массив.

## Псевдоним {#alias}

- GROUP_ARRAY

## Синтаксис {#syntax}

```sql
COLLECT_LIST(<expr> [,<max_size>])
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Выражение, определяющее значения, которые будут помещены в массив. Поддерживаемые типы: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, Timestamptz, IPV4, IPV6, UUID, String, Array, Map, Struct. |
| `<max_size>` | Необязательный параметр, ограничивающий размер результирующего массива до max_size элементов. Поддерживаемый тип: Integer. |

## Возвращаемое значение {#return-value}

Возвращает значение типа ARRAY, содержащее все значения, отличные от NULL. Если в группе нет допустимых данных, возвращает пустой массив.

## Пример {#example}

```sql
-- setup
CREATE TABLE collect_list_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_list_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 30, 'c'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```

```sql
select collect_list(k1),collect_list(k1,3) from collect_list_test;
```

```text
+--------------------+--------------------+
| collect_list(k1)   | collect_list(k1,3) |
+--------------------+--------------------+
| [1, 1, 1, 2, 2, 3] | [1, 1, 1]          |
+--------------------+--------------------+
```

```sql
select k1,collect_list(k2),collect_list(k3,1) from collect_list_test group by k1 order by k1;
```

```text
+------+------------------+--------------------+
| k1   | collect_list(k2) | collect_list(k3,1) |
+------+------------------+--------------------+
|    1 | [10, 20, 30]     | ["a"]              |
|    2 | [100, 200]       | ["x"]              |
|    3 | []               | []                 |
+------+------------------+--------------------+
```
