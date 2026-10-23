---
{
    "title": "ALTER TABLE PROPERTY",
    "language": "ru",
    "description": "Эта инструкция используется для изменения свойств существующей таблицы. Операция выполняется синхронно,"
}
---

:::caution
Различия между атрибутами партиций и атрибутами таблиц
- Атрибуты партиций в основном определяют число бакетов (buckets), носитель хранения (storage_medium), число реплик (replication_num) и политики разделения горячих и холодных данных (storage_policy).
  - Для существующих партиций атрибуты можно изменить с помощью ALTER TABLE {tableName} MODIFY PARTITION ({partitionName}) SET ({key}={value}), однако число бакетов (buckets) изменить нельзя.
  - Для динамических партиций, которые ещё не созданы, атрибуты можно изменить с помощью ALTER TABLE {tableName} SET (dynamic_partition.{key} = {value}).
  - Для автоматических партиций, которые ещё не созданы, атрибуты можно изменить с помощью ALTER TABLE {tableName} SET ({key} = {value}).
  - Чтобы изменить атрибуты партиций, необходимо изменить атрибуты как уже созданных, так и ещё не созданных партиций.
- Все остальные атрибуты, кроме перечисленных выше, относятся к уровню таблицы.
- Подробнее об атрибутах см. в разделе [Атрибуты создания таблицы](../../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md#table-property-related-parameters)
:::

## Описание {#description}

Эта инструкция используется для изменения свойств существующей таблицы. Операция выполняется синхронно: возврат управления после выполнения команды означает, что операция завершена.

В настоящее время поддерживается изменение столбцов таблицы, для которых используется bloom filter, атрибутов colocate_with и dynamic_partition, а также replication_num и default.replication_num.

Синтаксис:

```sql
ALTER TABLE [database.]table alter_clause;
```

Для изменения свойств в alter_clause поддерживаются следующие варианты.

Примечание:

Изменение свойств также можно включить в приведённую выше операцию изменения схемы; см. пример ниже.

1. Изменить столбец таблицы, для которого используется bloom filter

```sql
ALTER TABLE example_db.my_table SET ("bloom_filter_columns"="k1,k2,k3");
```

Изменение также можно включить в приведённую выше операцию изменения схемы (обратите внимание: синтаксис для нескольких предложений немного отличается).

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
PROPERTIES ("bloom_filter_columns"="k1,k2,k3");
```

2. Изменить свойство Colocate таблицы

```sql
ALTER TABLE example_db.my_table set ("colocate_with" = "t1");
```

3. Изменить способ распределения таблицы по бакетам с Hash Distribution на Random Distribution

```sql
ALTER TABLE example_db.my_table set ("distribution_type" = "random");
```

4. Изменить атрибут динамического партиционирования таблицы (поддерживается добавление атрибутов динамического партиционирования в таблицу, у которой их нет)

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "false");
```

При добавлении атрибутов динамического партиционирования в таблицу, у которой их нет, необходимо указать все атрибуты динамического партиционирования.
   (Примечание: добавление атрибутов динамического партиционирования не поддерживается для таблиц без партиций.)

```sql
ALTER TABLE example_db.my_table set (
  "dynamic_partition.enable" = "true", 
  "dynamic_partition.time_unit" = "DAY", 
  "dynamic_partition.end" = "3", 
  "dynamic_partition.prefix" = "p", 
  "dynamic_partition. buckets" = "32"
);
```

5. Изменить атрибут in_memory таблицы; допускается только значение 'false'

```sql
ALTER TABLE example_db.my_table set ("in_memory" = "false");
```

6. Включить пакетное удаление

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "BATCH_DELETE";
```

Примечание:

- Поддерживаются только таблицы с уникальными ключами.
-  Пакетное удаление можно включить для старых таблиц; в новых таблицах оно уже поддерживается с момента создания.

7. Включить функцию, обеспечивающую порядок загрузки по значениям столбца sequence

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES (
  "function_column.sequence_type" = "Date"
);
```

Примечание:

- Поддерживаются только таблицы с уникальными ключами.
- sequence_type задаёт тип столбца sequence; поддерживаются целочисленные типы и типы времени.
- Порядок обеспечивается только для вновь загружаемых данных. Исторические данные изменить нельзя.

8. Изменить число бакетов таблицы по умолчанию на 50

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 50;
```

Примечание:

- Поддерживаются только партиционированные таблицы, не использующие Colocate. Подробнее см. в разделе [ALTER TABLE DISTRIBUTION](./ALTER-TABLE-DISTRIBUTION).

9. Изменить комментарий таблицы

```sql
ALTER TABLE example_db.my_table MODIFY COMMENT "new comment";
```

10. Изменить комментарии столбцов

```sql
ALTER TABLE example_db.my_table MODIFY COLUMN k1 COMMENT "k1", MODIFY COLUMN k2 COMMENT "k2";
```

11. Изменить тип движка

Поддерживается только изменение типа MySQL на ODBC. В качестве значения driver указывается имя драйвера из конфигурации odbc.init.

```sql
ALTER TABLE example_db.mysql_table MODIFY ENGINE TO odbc PROPERTIES("driver" = "MySQL");
```

12. Изменить число реплик

```sql
ALTER TABLE example_db.mysql_table SET ("replication_num" = "2");
ALTER TABLE example_db.mysql_table SET ("default.replication_num" = "2");
ALTER TABLE example_db.mysql_table SET ("replication_allocation" = "tag.location.default: 1");
ALTER TABLE example_db.mysql_table SET ("default.replication_allocation" = "tag.location.default: 1");
```

Примечание:
1. Свойство с префиксом default задаёт распределение реплик по умолчанию для изменяемой таблицы. Его изменение не затрагивает текущее фактическое распределение реплик таблицы, а влияет только на распределение реплик вновь создаваемых партиций в партиционированной таблице.
2. Для таблиц без партиций изменение свойства распределения реплик без префикса default изменяет как распределение реплик по умолчанию, так и фактическое распределение реплик таблицы. То есть после изменения в выводе инструкций `show create table` и `show partitions from tbl` можно увидеть, что распределение реплик было
изменено.
3. Для партиционированных таблиц фактическое распределение реплик задаётся на уровне партиций: у каждой партиции своё распределение реплик, которое можно просмотреть с помощью инструкции `show partitions from tbl`. Чтобы изменить фактическое распределение реплик, см. `ALTER TABLE PARTITION`.

13\. **[Экспериментально]** включить `light_schema_change`

  Для таблиц, при создании которых light_schema_change не был включён, его можно включить следующей инструкцией.

```sql
ALTER TABLE example_db.mysql_table SET ("light_schema_change" = "true");
```

## Пример {#example}

1. Изменить столбец таблицы, для которого используется bloom filter

```sql
ALTER TABLE example_db.my_table SET ("bloom_filter_columns"="k1,k2,k3");
```

Изменение также можно включить в приведённую выше операцию изменения схемы (обратите внимание: синтаксис для нескольких предложений немного отличается).

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
PROPERTIES ("bloom_filter_columns"="k1,k2,k3");
```

2. Изменить свойство Colocate таблицы

```sql
ALTER TABLE example_db.my_table set ("colocate_with" = "t1");
```

3. Изменить способ распределения таблицы по бакетам с Hash Distribution на Random Distribution

```sql
ALTER TABLE example_db.my_table set ("distribution_type" = "random");
```

4. Изменить атрибут динамического партиционирования таблицы (поддерживается добавление атрибутов динамического партиционирования в таблицу, у которой их нет)

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "false");
```

При добавлении атрибутов динамического партиционирования в таблицу, у которой их нет, необходимо указать все атрибуты динамического партиционирования.
   (Примечание: добавление атрибутов динамического партиционирования не поддерживается для таблиц без партиций.)

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "true", "dynamic_partition.time_unit" = "DAY", "dynamic_partition.end" = "3", "dynamic_partition.prefix" = "p", "dynamic_partition. buckets" = "32");
```

5. Изменить атрибут in_memory таблицы; допускается только значение 'false'

```sql
ALTER TABLE example_db.my_table set ("in_memory" = "false");
```

6. Включить пакетное удаление

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "BATCH_DELETE";
```

7. Включить функцию, обеспечивающую порядок загрузки по значениям столбца sequence

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date");
```

8. Изменить число бакетов таблицы по умолчанию на 50

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 50;
```

9. Изменить комментарий таблицы

```sql
ALTER TABLE example_db.my_table MODIFY COMMENT "new comment";
```

10. Изменить комментарии столбцов

```sql
ALTER TABLE example_db.my_table MODIFY COLUMN k1 COMMENT "k1", MODIFY COLUMN k2 COMMENT "k2";
```

11. Изменить тип движка

```sql
ALTER TABLE example_db.mysql_table MODIFY ENGINE TO odbc PROPERTIES("driver" = "MySQL");
```

12. Добавить для таблицы политику миграции данных с разделением на холодные и горячие
```sql
 ALTER TABLE create_table_not_have_policy set ("storage_policy" = "created_create_table_alter_policy");
```
ПРИМЕЧАНИЕ: Политику можно добавить только для таблицы, с которой ещё не связана политика хранения. Таблица может иметь только одну политику хранения.

13. Добавить для партиции таблицы политику миграции горячих и холодных данных
```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="created_create_table_partition_alter_policy");
```
ПРИМЕЧАНИЕ: Политику можно добавить только для партиции таблицы, с которой ещё не связана политика хранения. Таблица может иметь только одну политику хранения.


## Ключевые слова {#keywords}

```text
ALTER, TABLE, PROPERTY, ALTER TABLE
```

## Рекомендации по применению {#best-practice}
