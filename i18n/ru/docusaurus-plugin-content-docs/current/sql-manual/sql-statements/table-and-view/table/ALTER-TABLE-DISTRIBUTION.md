---
{
    "title": "ALTER TABLE DISTRIBUTION",
    "language": "ru",
    "description": "Эта инструкция используется для изменения настроек распределения по бакетам, применяемых по умолчанию для партиционированной таблицы."
}
---

## Описание {#description}

Эта инструкция используется для изменения настроек распределения по бакетам, применяемых по умолчанию для партиционированной таблицы. Операция выполняется синхронно: возврат управления после выполнения команды означает, что операция завершена.

Эта инструкция изменяет количество бакетов по умолчанию только для **вновь создаваемых партиций**. Количество бакетов в существующих партициях остаётся прежним.

Синтаксис:

```sql
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(column1[, column2, ...]) BUCKETS { num | AUTO };
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS { num | AUTO };
```

Примечание:

- `num`: положительное целое число, задающее фиксированное количество бакетов для новых партиций.
- `AUTO`: система автоматически определяет количество бакетов для новых партиций с учётом объёма данных и конфигурации кластера.
- Тип распределения (HASH или RANDOM) и столбцы распределения должны оставаться такими же, как в исходном определении таблицы. Можно изменить только количество бакетов.
- Эта инструкция применяется только к **партиционированным таблицам** (с партиционированием RANGE или LIST). Непартиционированные таблицы не поддерживаются.
- Эта инструкция не поддерживается для таблиц **Colocate**.
- Можно свободно переключаться между фиксированным количеством бакетов и `AUTO`, а также выполнять несколько изменений подряд.

### Взаимодействие с AUTO PARTITION {#interaction-with-auto-partition}

Для таблиц, использующих [AUTO PARTITION](../../../../table-design/data-partitioning/auto-partitioning), новые партиции, автоматически создаваемые при вставке данных после выполнения `ALTER TABLE MODIFY DISTRIBUTION`, будут использовать новые настройки бакетов. Партиции, автоматически созданные до изменения настроек, остаются без изменений.

Например, если таблица AUTO PARTITION изначально использует `BUCKETS 5`, а вы меняете настройку на `BUCKETS 8`, то любой последующий INSERT, вызывающий автоматическое создание новой партиции, назначит этой партиции 8 бакетов. Если затем изменить настройку на `BUCKETS AUTO`, система будет автоматически определять количество бакетов для новых автоматически создаваемых партиций.

### Взаимодействие с Dynamic Partition {#interaction-with-dynamic-partition}

Для таблиц, использующих [Dynamic Partition](../../../../table-design/data-partitioning/dynamic-partitioning), новые партиции, автоматически создаваемые планировщиком динамического партиционирования после выполнения `ALTER TABLE MODIFY DISTRIBUTION`, будут использовать новые настройки бакетов. Существующие динамические партиции остаются без изменений.

Обратите внимание, что таблицы Dynamic Partition также поддерживают свойство `dynamic_partition.buckets`. Если заданы обе настройки, для динамически создаваемых партиций приоритет имеет свойство `dynamic_partition.buckets`. Чтобы для динамических партиций использовалось количество бакетов по умолчанию на уровне таблицы (заданное с помощью `MODIFY DISTRIBUTION`), убедитесь, что свойство `dynamic_partition.buckets` не задано явно, либо измените его соответствующим образом с помощью `ALTER TABLE ... SET ("dynamic_partition.buckets" = "...")`.

## Примеры {#example}

1. Изменение количества бакетов по умолчанию для таблицы с партиционированием RANGE и распределением HASH с исходного значения на 10

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

После этого любая новая партиция будет использовать 10 бакетов:

```sql
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 will have 10 buckets; existing partitions remain unchanged
```

2. Переключение с фиксированного количества бакетов на AUTO

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
```

После этого система будет автоматически определять количество бакетов для вновь создаваемых партиций.

3. Переключение с AUTO обратно на фиксированное количество бакетов

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 3;
```

4. Изменение количества бакетов по умолчанию для таблицы с партиционированием LIST

```sql
ALTER TABLE example_db.my_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;
```

5. Изменение количества бакетов по умолчанию для таблицы с распределением RANDOM

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 12;
```

6. Переключение таблицы с распределением RANDOM на автоматический выбор количества бакетов (AUTO)

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS AUTO;
```

7. Изменение количества бакетов по умолчанию для таблицы AUTO PARTITION (RANGE)

```sql
-- Original table uses AUTO PARTITION BY RANGE with BUCKETS 5
ALTER TABLE example_db.my_auto_range_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;

-- New auto-created partitions from subsequent INSERT will use 8 buckets
INSERT INTO example_db.my_auto_range_table VALUES ('2024-01-03', 3);
```

8. Изменение количества бакетов по умолчанию для таблицы AUTO PARTITION (LIST)

```sql
-- Original table uses AUTO PARTITION BY LIST with BUCKETS 4
ALTER TABLE example_db.my_auto_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 7;

-- New auto-created partitions from subsequent INSERT will use 7 buckets
INSERT INTO example_db.my_auto_list_table VALUES ('ccc', 3);
```

9. Переключение таблицы AUTO PARTITION с автоматического определения количества бакетов (AUTO) на фиксированное количество и обратно

```sql
-- Table originally created with BUCKETS AUTO
ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 5;
-- New partitions will use 5 buckets

ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
-- New partitions will return to system-determined bucket count
```

10. Несколько последовательных изменений

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 4;
ALTER TABLE example_db.my_table ADD PARTITION p2 VALUES LESS THAN ('20');
-- p2 has 4 buckets

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 has system-determined bucket count

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 6;
ALTER TABLE example_db.my_table ADD PARTITION p4 VALUES LESS THAN ('40');
-- p4 has 6 buckets
```

11. Операции, вызывающие ошибки

Таблицы Colocate не поддерживаются:

```sql
-- This will fail with: "Cannot change default bucket number of colocate table"
ALTER TABLE example_db.my_colocate_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

Непартиционированные таблицы не поддерживаются:

```sql
-- This will fail with: "Only support change partitioned table's distribution"
ALTER TABLE example_db.my_unpartitioned_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

Нельзя изменить тип распределения:

```sql
-- Original table uses HASH distribution; changing to RANDOM will fail
-- Error: "Cannot change distribution type"
ALTER TABLE example_db.my_hash_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 10;
```

Нельзя изменить столбцы распределения:

```sql
-- Original table uses HASH(k1); changing to HASH(k2) will fail
-- Error: "Cannot assign hash distribution with different distribution cols"
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k2) BUCKETS 10;
```

## Ключевые слова {#keywords}

```text
ALTER, TABLE, DISTRIBUTION, MODIFY DISTRIBUTION, BUCKETS, ALTER TABLE
```
