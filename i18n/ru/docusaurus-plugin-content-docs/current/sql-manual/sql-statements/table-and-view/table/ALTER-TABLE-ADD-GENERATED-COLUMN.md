---
{
    "title": "ALTER TABLE ADD GENERATED COLUMN",
    "language": "ru",
    "description": "ALTER TABLE ADD COLUMN не поддерживает добавление вычисляемого столбца,"
}
---

Оператор ALTER TABLE ADD COLUMN не поддерживает добавление вычисляемого столбца, а оператор ALTER TABLE MODIFY COLUMN не поддерживает изменение сведений о вычисляемом столбце.
Синтаксис ALTER TABLE позволяет изменять порядок вычисляемых столбцов, переименовывать и удалять их.

В неподдерживаемых сценариях выводится следующая ошибка:

```sql
mysql> CREATE TABLE test_alter_add_column(a int, b int) properties("replication_num"="1");
Query OK, 0 rows affected (0.14 sec)
mysql> ALTER TABLE test_alter_add_column ADD COLUMN c int AS (a+b);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table add generated columns.
mysql> ALTER TABLE test_alter MODIFY COLUMN c int KEY AS (a+b+1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table modify generated columns.
```

### Изменение порядка столбцов {#reorder-column}

```sql
ALTER TABLE products ORDER BY (product_id, total_value, price, quantity);
```

Примечание:
После изменения порядок столбцов по-прежнему должен соответствовать ограничениям на порядок, действующим при создании вычисляемых столбцов и таблиц.
### Переименование столбца {#rename-column}

```sql
ALTER TABLE products RENAME COLUMN total_value new_name;
```

Примечание:
Если на столбец таблицы (вычисляемый или обычный) ссылаются другие вычисляемые столбцы, перед изменением имени этого вычисляемого столбца необходимо удалить эти другие вычисляемые столбцы.
### Удаление столбца {#drop-column}

```sql
ALTER TABLE products DROP COLUMN total_value;
```

Примечание:
Если на столбец таблицы (вычисляемый или обычный) ссылаются другие вычисляемые столбцы, перед удалением этого вычисляемого или обычного столбца необходимо сначала удалить ссылающиеся на него вычисляемые столбцы.
