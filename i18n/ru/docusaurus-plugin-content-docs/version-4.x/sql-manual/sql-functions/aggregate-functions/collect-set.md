---
{
    "title": "COLLECT_SET",
    "language": "ru",
    "description": "Агрегатная функция собирает все уникальные значения указанного столбца, удаляет повторяющиеся элементы и возвращает результат в виде множества."
}
---

## Описание {#description}

Агрегатная функция собирает все уникальные значения указанного столбца, удаляет повторяющиеся элементы и возвращает результат в виде множества.

## Псевдоним {#alias}

- GROUP_UNIQ_ARRAY

## Синтаксис {#syntax}

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Выражение, определяющее значения, которые будут включены в массив. Поддерживаемые типы: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, Timestamptz, IPV4, IPV6, String, Array, Map, Struct. |
| `<max_size>` | Необязательный параметр, ограничивающий размер результирующего массива до max_size элементов. Поддерживаемый тип: Integer. |

## Возвращаемое значение {#return-value}

Возвращает значение типа ARRAY, содержащее все значения, отличные от NULL, после удаления дубликатов. Если в группе нет допустимых данных, возвращает пустой массив.

## Пример {#example}

```sql
-- setup
CREATE TABLE collect_set_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_set_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 10, 'a'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```

```sql
select collect_set(k1),collect_set(k1,2) from collect_set_test;
```

```text
+-----------------+-------------------+
| collect_set(k1) | collect_set(k1,2) |
+-----------------+-------------------+
| [2, 1, 3]       | [2, 1]            |
+-----------------+-------------------+
```

```sql
select k1,collect_set(k2),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```

```text
+------+-----------------+-------------------+
| k1   | collect_set(k2) | collect_set(k3,1) |
+------+-----------------+-------------------+
|    1 | [20, 10]        | ["a"]             |
|    2 | [200, 100]      | ["x"]             |
|    3 | []              | []                |
+------+-----------------+-------------------+
```
