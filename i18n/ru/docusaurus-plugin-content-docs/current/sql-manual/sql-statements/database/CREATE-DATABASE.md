---
{
    "title": "CREATE DATABASE",
    "language": "ru",
    "description": "Эта инструкция используется для создания новой базы данных"
}
---

## Описание {#description}

Эта инструкция используется для создания новой базы данных

## Синтаксис {#syntax}

```sql
CREATE DATABASE [IF NOT EXISTS] <db_name>
    [PROPERTIES ("<key>"="<value>"[, ... ])];
```

## Обязательные параметры {#required-parameters}

** 1. `<db_name>`**
>  Имя базы данных

## Необязательные параметры {#optional-parameters}

** 1. `<PROPERTIES>`**
>  Дополнительная информация об этой базе данных

## Управление доступом {#permission-control}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие права:

| Права         | Объект    | Примечания             |
|:-----------|:------|:---------------|
| CREATE_PRIV | Соответствующая база данных | Необходимо иметь право на создание для соответствующей базы данных |


## Особенности использования {#precautions}

Чтобы задать стратегию распределения реплик по умолчанию для таблиц в базе данных, укажите `<replication_allocation>` (атрибут `<replication_allocation>` таблицы имеет более высокий приоритет, чем соответствующий атрибут базы данных):

  ```sql
  PROPERTIES (
    "replication_allocation" = "tag.location.default:3"
  )
  ```

Чтобы задать Storage Vault по умолчанию для таблиц в базе данных, укажите `<storage_vault_name>` (атрибут `<storage_vault_name>` таблицы имеет более высокий приоритет, чем соответствующий атрибут базы данных):

  ```sql
  PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
  )
  ```

:::info Примечание

Настройка `storage_vault_name` для базы данных поддерживается начиная с версии 3.0.5

:::

## Примеры {#example}

- Создание новой базы данных db_test

   ```sql
   CREATE DATABASE db_test;
   ```

- Создание новой базы данных с заданным распределением реплик по умолчанию:

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"replication_allocation" = "tag.location.group_1:3"
   );
   ```

- Создание новой базы данных с заданным Storage Vault по умолчанию:

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"storage_vault_name" = "hdfs_demo_vault"
   );
   ```
