---
{
    "title": "UUID_VERSION",
    "language": "ru",
    "description": "Извлечение четырёхбитного поля версии нативного UUID в виде TINYINT, включая поведение для NULL и UUID, состоящих только из нулей или только из единиц."
}
---

## Описание {#description}

Извлекает четырёхбитное поле версии UUID; возвращает `NULL` при входном значении `NULL`.

## Синтаксис {#syntax}

```sql
UUID_VERSION(<uuid>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<uuid>` | Значение типа UUID. |

## Возвращаемое значение {#return-value}

Возвращает `TINYINT` в диапазоне 0–15. Считывает биты версии без проверки варианта или соответствия спецификации версии UUID. Для UUID, состоящего только из нулей, возвращает 0, а для UUID, состоящего только из единиц, возвращает 15. При входном значении `NULL` возвращает `NULL`.

## Пример {#example}

```sql
SELECT UUID_VERSION(CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID)) AS v4,
       UUID_VERSION(CAST('018f0f59-1010-7abc-9234-001122334455' AS UUID)) AS v7,
       UUID_VERSION(CAST('00000000-0000-0000-0000-000000000000' AS UUID)) AS zero_version,
       UUID_VERSION(CAST('ffffffff-ffff-ffff-ffff-ffffffffffff' AS UUID)) AS max_version,
       UUID_VERSION(CAST(NULL AS UUID)) AS null_version;
```

```text
+----+----+--------------+-------------+--------------+
| v4 | v7 | zero_version | max_version | null_version |
+----+----+--------------+-------------+--------------+
| 4  | 7  | 0            | 15          | NULL         |
+----+----+--------------+-------------+--------------+
```
