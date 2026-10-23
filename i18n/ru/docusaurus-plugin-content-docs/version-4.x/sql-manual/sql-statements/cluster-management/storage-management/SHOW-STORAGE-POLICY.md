---
{
    "title": "SHOW STORAGE POLICY",
    "language": "ru",
    "description": "Просмотр таблиц и разделов, связанных со всеми или указанными политиками хранения."
}
---

## Описание {#description}

Просмотр таблиц и разделов, связанных со всеми или указанными политиками хранения.

## Синтаксис {#syntax}

```sql
SHOW STORAGE POLICY [ USING [ FOR <storage_policy_name> ] ]
```

## Обязательные параметры {#required-parameters}

<storage_policy_name>

> Имя политики хранения для просмотра.

Для успешного выполнения этой команды SQL необходимы права ADMIN_PRIV. Подробнее см. в
документации по правам доступа.

| Права доступа (Права доступа) | Объект (Объект)                      | Примечания (Примечания)          |
|-----------------------|--------------------------------------|---------------------------------|
| ADMIN_PRIV            | Права на управление всем кластером   | Все права, кроме NODE_PRIV       |

## Пример {#example}

1. Просмотр всех объектов, для которых включены политики хранения.

   ```sql
   show storage policy using;
   ```
   ```text
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   | PolicyName            | Database                                | Table                                  | Partitions |
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   | test_storage_policy   | regression_test_cold_heat_separation_p2 | table_with_storage_policy_1            | ALL        |
   | test_storage_policy   | regression_test_cold_heat_separation_p2 | partition_with_multiple_storage_policy | p201701    |
   | test_storage_policy_2 | regression_test_cold_heat_separation_p2 | partition_with_multiple_storage_policy | p201702    |
   | test_storage_policy_2 | regression_test_cold_heat_separation_p2 | table_with_storage_policy_2            | ALL        |
   | test_policy           | db2                                     | db2_test_1                             | ALL        |
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   ```

2. Просмотр объектов, использующих политику хранения test_storage_policy.

   ```sql
   show storage policy using for test_storage_policy;
   ```
   ```text
   +---------------------+-----------+---------------------------------+------------+
   | PolicyName          | Database  | Table                           | Partitions |
   +---------------------+-----------+---------------------------------+------------+
   | test_storage_policy | db_1      | partition_with_storage_policy_1 | p201701    |
   | test_storage_policy | db_1      | table_with_storage_policy_1     | ALL        |
   +---------------------+-----------+---------------------------------+------------+
   ```

3. Просмотр свойств всех политик хранения.

   ```sql
   show storage policy;
   ```
   ```text
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   | PolicyName  | Id       | Version | Type    | StorageResource | CooldownDatetime | CooldownTtl |
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   | test_policy | 14589252 | 0       | STORAGE | remote_s3       | -1               | 300         |
   | dev_policy  | 14589521 | 0       | STORAGE | remote_s3       | -1               | 3000        |
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   ```
