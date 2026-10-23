---
{
    "title": "ALTER TABLE COMMENT",
    "language": "ru",
    "description": "Эта инструкция используется для изменения комментария к существующей таблице. Операция выполняется синхронно: возврат из команды означает, что операция завершена."
}
---

## Описание {#description}

Эта инструкция используется для изменения комментария к существующей таблице. Операция выполняется синхронно: возврат из команды означает, что операция завершена.

## Синтаксис {#syntax}

```sql
ALTER TABLE [database.]table alter_clause;
```

1. Изменить комментарий к таблице

## Синтаксис {#syntax-1}

```sql
MODIFY COMMENT "new table comment";
```

2. Изменить комментарий к столбцу

## Синтаксис {#syntax-2}

```sql
MODIFY COLUMN col1 COMMENT "new column comment";
```

## Пример {#example}

1. Изменить комментарий к таблице table1 на table1_comment

```sql
ALTER TABLE table1 MODIFY COMMENT "table1_comment";
```

2. В таблице table1 изменить комментарий к столбцу col1 на table1_comment

```sql
ALTER TABLE table1 MODIFY COLUMN col1 COMMENT "table1_col1_comment";
```

## Ключевые слова {#keywords}

```text
ALTER, TABLE, COMMENT, ALTER TABLE
```

## Рекомендации по применению {#best-practice}
