---
{
    "title": "GROUP_CONCAT",
    "language": "ru",
    "description": "Функция GROUPCONCAT объединяет значения из нескольких строк результирующего набора в одну строку."
}
---

## Описание {#description}

Функция GROUP_CONCAT объединяет значения из нескольких строк результирующего набора в одну строку.

## Синтаксис {#syntax}

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```

## Параметры {#parameters}

| Параметры | Описание |
| ------------ | ---------------------- |
| `<str>`      | Обязательный. Выражение, значение которого нужно объединить с другими. |
| `<sep>`      | Необязательный. Разделитель между строками. |
| `<col_name>` | Необязательный. Столбец, используемый для сортировки.   |
| `<expr>`     | Необязательный. Выражение, используемое для сортировки. |

## Возвращаемое значение {#return-value}

Возвращает значение типа VARCHAR.
Если входные данные содержат NULL, возвращает NULL.

## Пример {#example}

```sql
-- setup
create table test(
    value varchar(10)
) distributed by hash(value) buckets 1
properties ("replication_num"="1");

insert into test values
    ("a"),
    ("b"),
    ("c"),
    ("c");
```

```sql
select GROUP_CONCAT(value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c, c            |
+-----------------------+
```

```sql
select GROUP_CONCAT(DISTINCT value) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c               |
+-----------------------+
```

```sql
select GROUP_CONCAT(value ORDER BY value DESC) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| c, c, b, a            |
+-----------------------+
```

```sql
select GROUP_CONCAT(DISTINCT value ORDER BY value DESC) from test;
```

```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| c, b, a               |
+-----------------------+
```

```sql
select GROUP_CONCAT(value, " ") from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, ' ') |
+----------------------------+
| a b c c                    |
+----------------------------+
```

```sql
select GROUP_CONCAT(value, NULL) from test;
```

```text
+----------------------------+
| GROUP_CONCAT(`value`, NULL)|
+----------------------------+
| NULL                       |
+----------------------------+
```
