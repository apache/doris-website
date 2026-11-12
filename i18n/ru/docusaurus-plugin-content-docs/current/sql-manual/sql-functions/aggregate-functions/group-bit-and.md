---
{
    "title": "GROUP_BIT_AND",
    "language": "ru",
    "description": "Выполняет побитовую операцию AND над всеми значениями одного целочисленного столбца или выражения."
}
---

## Описание {#description}

Выполняет побитовую операцию AND над всеми значениями одного целочисленного столбца или выражения.

## Синтаксис {#syntax}

```sql
GROUP_BIT_AND(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Поддерживаемые типы: TinyInt, SmallInt, Integer, BigInt, LargeInt. |

## Возвращаемое значение {#return-value}

Возвращает целочисленное значение того же типа, что и <expr>. Если все значения равны NULL, возвращает NULL. Значения NULL не участвуют в побитовой операции.

## Пример {#example}

```sql
-- setup
create table group_bit(
    value int
) distributed by hash(value) buckets 1
properties ("replication_num"="1");

insert into group_bit values
    (3),
    (1),
    (2),
    (4),
    (NULL);
```

```sql
select group_bit_and(value) from group_bit;
```

```text
+----------------------+
| group_bit_and(value) |
+----------------------+
|                    0 |
+----------------------+
```

```sql
select group_bit_and(value) from group_bit where value is null;
```

```text
+----------------------+
| group_bit_and(value) |
+----------------------+
|                 NULL |
+----------------------+
```
