---
{
    "title": "GROUP_ARRAY_UNION",
    "language": "ru",
    "description": "Объединяет элементы массивов из всех входных строк, удаляя дубликаты, и возвращает новый массив."
}
---

## Описание {#description}

Объединяет элементы массивов из всех входных строк, удаляя дубликаты, и возвращает новый массив.

## Синтаксис {#syntax}

```sql
GROUP_ARRAY_UNION(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Выражение для вычисления объединения. Поддерживаемый тип: Array<Type>. Вложенные сложные типы внутри Array не поддерживаются. |

## Возвращаемое значение {#return-value}

Возвращает массив с результатом объединения. Если в группе нет допустимых данных, возвращает пустой массив.

## Пример {#example}


```sql
-- setup
CREATE TABLE group_array_union_test (
	id INT,
	c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_union_test VALUES
	(1, ['a', 'b', 'c', 'd', 'e']),
	(2, ['a', 'b']),
	(3, ['a', null]),
	(4, NULL);
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test;
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "c", "e", "b", "d", "a"]   |
+-----------------------------------+
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (3,4);
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "a"]                       |
+-----------------------------------+
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (4);
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| []                                |
+-----------------------------------+
```
