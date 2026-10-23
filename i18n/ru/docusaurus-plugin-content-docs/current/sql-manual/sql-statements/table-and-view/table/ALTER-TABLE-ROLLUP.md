---
{
    "title": "ALTER TABLE ROLLUP",
    "language": "ru",
    "description": "Эта инструкция используется для изменения rollup существующей таблицы. Операция rollup выполняется асинхронно,"
}
---

## Описание {#description}

Эта инструкция используется для изменения rollup существующей таблицы. Операция rollup выполняется асинхронно: инструкция возвращает управление после успешной отправки задачи. Затем можно отслеживать ход выполнения с помощью команды [SHOW ALTER](../../../../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE).

Синтаксис:

```sql
ALTER TABLE [database.]table alter_clause;
```

В alter_clause для rollup поддерживаются следующие способы создания

1. Создание индекса rollup

Синтаксис:

```sql
ADD ROLLUP rollup_name (column_name1, column_name2, ...)
[FROM from_index_name]
[PROPERTIES ("key"="value", ...)]
```

properties: позволяет задать тайм-аут; по умолчанию он составляет 1 день.

2. Пакетное создание индексов rollup

Синтаксис:

```sql
ADD ROLLUP [rollup_name (column_name1, column_name2, ...)
                    [FROM from_index_name]
                    [PROPERTIES ("key"="value", ...)],...]
```

Примечание:

- Если from_index_name не указан, индекс по умолчанию создаётся на основе базового индекса
- Столбцы таблицы rollup должны уже присутствовать в from_index
- В properties можно указать формат хранения. Подробнее см. [CREATE TABLE](./CREATE-TABLE)

3. Удаление индекса rollup

 Синтаксис:

```sql
DROP ROLLUP rollup_name [PROPERTIES ("key"="value", ...)]
```

4. Пакетное удаление индексов rollup

Синтаксис:

```sql
DROP ROLLUP [rollup_name [PROPERTIES ("key"="value", ...)],...]
```

Примечание:

- Базовый индекс удалить нельзя

## Пример {#example}

1. Создание индекса example_rollup_index на основе базового индекса (k1,k2,k3,v1,v2). Колоночное хранение.

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1, v2);
```

2. Создание индекса example_rollup_index2 на основе example_rollup_index (k1,k3,v1,v2)

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index2 (k1, v1)
FROM example_rollup_index;
```

3. Создание индекса example_rollup_index3 на основе базового индекса (k1,k2,k3,v1), с явно заданным тайм-аутом rollup в один час.

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1)
PROPERTIES("timeout" = "3600");
```

4. Удаление индекса example_rollup_index2

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2;
```

5. Пакетное удаление индексов rollup

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2,example_rollup_index3;
```

## Ключевые слова {#keywords}

```text
ALTER, TABLE, ROLLUP, ALTER TABLE
```

## Рекомендации по применению {#best-practice}
