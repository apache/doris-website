---
{
    "title": "GROUP_ARRAY_INTERSECT",
    "language": "ru",
    "description": "Вычисляет пересечение массивов из всех строк и возвращает новый массив."
}
---

## Описание {#description}

Вычисляет пересечение массивов из всех строк и возвращает новый массив.

## Синтаксис {#syntax}

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Выражение для вычисления пересечения. Поддерживаемый тип: Array. |

## Возвращаемое значение {#return-value}

Возвращает массив, содержащий результат пересечения. Если в группе нет допустимых данных, возвращает пустой массив.

## Пример {#example}

```sql
-- setup
CREATE TABLE group_array_intersect_test (
    id INT,
    c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_intersect_test VALUES
    (1, ['a', 'b', 'c', 'd', 'e']),
    (2, ['a', 'b']),
    (3, ['a', null]);
```

```sql
select group_array_intersect(c_array_string) from group_array_intersect_test;
```

```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| ["a"]                                 |
+---------------------------------------+
```

```sql
select group_array_intersect(c_array_string) from group_array_intersect_test where id is null;
```

```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| []                                    |
+---------------------------------------+
```
