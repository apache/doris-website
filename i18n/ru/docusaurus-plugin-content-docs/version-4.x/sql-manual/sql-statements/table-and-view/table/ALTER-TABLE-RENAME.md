---
{
    "title": "ALTER TABLE RENAME",
    "language": "ru",
    "description": "Эта инструкция позволяет изменять имена отдельных свойств существующей таблицы. Операция выполняется синхронно."
}
---

## Описание {#description}

Эта инструкция позволяет изменять имена отдельных свойств существующей таблицы. Операция выполняется синхронно: возврат управления после команды означает завершение её выполнения.

Синтаксис:

```sql
ALTER TABLE [database.]table alter_clause;
```

Предложение alter_clause для переименования поддерживает изменение следующих имён:

1. Изменение имени таблицы

Синтаксис:

```sql
RENAME new_table_name;
```

2. Изменение имени индекса rollup

 Синтаксис:

```sql
RENAME ROLLUP old_rollup_name new_rollup_name;
```

3. Изменение имени раздела

Синтаксис:

```sql
RENAME PARTITION old_partition_name new_partition_name;
```

4. Изменение имени столбца

:::tip Подсказки
Эта возможность поддерживается начиная с версии Apache Doris 1.2
:::

Изменение имени столбца



Синтаксис:

```sql
RENAME COLUMN old_column_name new_column_name;
```

Примечание:

- При создании таблицы необходимо задать в её свойствах 'light_schema_change=true'.


## Пример {#example}

1. Переименование таблицы table1 в table2

```sql
ALTER TABLE table1 RENAME table2;
```

2. Переименование индекса rollup1 в таблице example_table в rollup2

```sql
ALTER TABLE example_table RENAME ROLLUP rollup1 rollup2;
```

3. Переименование раздела p1 в таблице example_table в p2

```sql
ALTER TABLE example_table RENAME PARTITION p1 p2;
```

4. Переименование столбца c1 в таблице example_table в c2

```sql
ALTER TABLE example_table RENAME COLUMN c1 c2;
```

## Ключевые слова {#keywords}

```text
ALTER, TABLE, RENAME, ALTER TABLE
```

## Рекомендации по применению {#best-practice}
