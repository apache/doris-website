---
{
    "title": "Управление Storage Vault: создание, настройка и контроль доступа",
    "sidebar_label": "Управление Storage Vault",
    "language": "ru",
    "description": "Описывает создание, просмотр и изменение Storage Vault в режиме с разделением вычислений и хранения, выбор места хранения для таблиц или баз данных и управление правами доступа пользователей.",
    "keywords": ["Storage Vault", "compute-storage decoupled", "object storage", "HDFS", "S3", "storage management", "Doris"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Storage configuration and management for compute-storage decoupled clusters -->

Storage Vault представляет собой абстракцию удалённого общего хранилища, которую Doris использует в режиме с разделением вычислений и хранения. Можно настроить один или несколько Storage Vault и хранить разные таблицы в разных Storage Vault для гибкого управления хранением данных.

## Создание Storage Vault {#create-a-storage-vault}

<!-- Knowledge type: Operational steps -->

**Синтаксис**

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value", ...)
```

`<vault_name>` задаётся пользователем и служит уникальным идентификатором Storage Vault для последующих операций.

### Создание Storage Vault на базе HDFS {#create-an-hdfs-storage-vault}

<!-- Applicable scenarios: Using HDFS as shared storage -->

Перед созданием Storage Vault на базе HDFS убедитесь, что все узлы (включая узлы FE, BE и Meta Service) имеют доступ к целевому HDFS. Для этого настройте авторизацию Kerberos и проверьте подключение (это можно проверить на каждом узле с помощью Hadoop Client).

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
PROPERTIES (
    "type"                          = "hdfs",                      -- required
    "fs.defaultFS"                  = "hdfs://127.0.0.1:8020",     -- required
    "path_prefix"                   = "big/data",                  -- optional, typically filled with the business name
    "hadoop.username"               = "user",                      -- optional
    "hadoop.security.authentication" = "kerberos",                 -- optional
    "hadoop.kerberos.principal"     = "hadoop/127.0.0.1@XXX",     -- optional
    "hadoop.kerberos.keytab"        = "/etc/emr.keytab"            -- optional
);
```

### Создание Storage Vault на базе S3 {#create-an-s3-storage-vault}

<!-- Applicable scenarios: Using object storage (OSS/S3/COS, etc.) as shared storage -->

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault_demo
PROPERTIES (
    "type"           = "S3",                                -- required
    "s3.endpoint"    = "oss-cn-beijing.aliyuncs.com",       -- required
    "s3.region"      = "cn-beijing",                        -- required
    "s3.bucket"      = "bucket",                            -- required
    "s3.root.path"   = "big/data/prefix",                   -- required
    "s3.access_key"  = "ak",                                -- required
    "s3.secret_key"  = "sk",                                -- required
    "provider"       = "OSS",                               -- required
    "use_path_style" = "false"                              -- optional
);
```

:::caution Требования к правам доступа
Для пути в объектном хранилище необходимы следующие права доступа: `head`, `get`, `list`, `put`, `multipartUpload`, `delete`.
:::

Дополнительные примеры для облачных провайдеров и описания параметров приведены в разделе [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT).

## Просмотр Storage Vault {#view-storage-vaults}

<!-- Knowledge type: Operational steps -->

**Синтаксис**

```sql
SHOW STORAGE VAULTS
```

Результат содержит 4 столбца:

| Столбец | Описание |
|--------|-------------|
| Имя Storage Vault | Идентификатор Storage Vault, заданный пользователем |
| ID Storage Vault | Уникальный ID, назначенный системой |
| Свойства | Свойства конфигурации Storage Vault |
| IsDefault | Является ли этот Storage Vault хранилищем по умолчанию |

## Установка Storage Vault по умолчанию {#set-the-default-storage-vault}

<!-- Knowledge type: Operational steps -->

**Синтаксис**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

После этой настройки Storage Vault по умолчанию используется автоматически, если при создании таблицы Storage Vault не указан явно.

## Указание Storage Vault при создании таблицы {#specify-a-storage-vault-when-creating-a-table}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Binding a storage location to a specific table -->

Укажите `storage_vault_name` в разделе `PROPERTIES` оператора `CREATE TABLE`. Данные таблицы будут храниться в соответствующем Storage Vault.

:::warning Примечание
После успешного создания таблицы её `storage_vault` **нельзя изменить**. Смена Storage Vault после создания таблицы не поддерживается.
:::

**Пример**

```sql
CREATE TABLE IF NOT EXISTS supplier (
    s_suppkey int(11)      NOT NULL COMMENT "",
    s_name    varchar(26)  NOT NULL COMMENT "",
    s_address varchar(26)  NOT NULL COMMENT "",
    s_city    varchar(11)  NOT NULL COMMENT "",
    s_nation  varchar(16)  NOT NULL COMMENT "",
    s_region  varchar(13)  NOT NULL COMMENT "",
    s_phone   varchar(16)  NOT NULL COMMENT ""
)
UNIQUE KEY (s_suppkey)
DISTRIBUTED BY HASH(s_suppkey) BUCKETS 1
PROPERTIES (
    "replication_num"    = "1",
    "storage_vault_name" = "hdfs_demo_vault"
);
```

## Указание Storage Vault при создании базы данных {#specify-a-storage-vault-when-creating-a-database}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Setting a default storage location for a database -->

Укажите `storage_vault_name` в разделе `PROPERTIES` оператора `CREATE DATABASE`. Новые таблицы, создаваемые в этой базе данных, наследуют её настройку Storage Vault, если для них Storage Vault не указан отдельно.

**Пример**

```sql
CREATE DATABASE IF NOT EXISTS `db_test`
PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
);
```

Значение `storage_vault_name` для базы данных можно изменить с помощью [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md). **Изменение действует только для вновь создаваемых таблиц и не затрагивает существующие таблицы.**

:::info Примечания о версиях и правила приоритета

- Указание Storage Vault при создании базы данных поддерживается начиная с **версии 3.0.5**.
- Приоритет выбора Storage Vault при создании таблицы (от высшего к низшему): **Таблица** > **База данных** > **Storage Vault по умолчанию**.
- При изменении `VAULT_NAME` у Storage Vault настройка хранилища на уровне базы данных может стать недействительной и вызывать ошибки. В этом случае необходимо заново задать для базы данных допустимое значение `storage_vault_name`.

:::

## Изменение Storage Vault {#modify-a-storage-vault}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Updating storage credentials or renaming a Vault -->

`ALTER STORAGE VAULT` обновляет свойства Storage Vault, доступные для изменения.

### Изменяемые свойства {#modifiable-properties}

Свойства, которые можно изменять для **Storage Vault на базе S3**:

| Свойство | Описание |
|----------|-------------|
| `VAULT_NAME` | Имя Storage Vault (переименование) |
| `s3.access_key` | ID ключа доступа |
| `s3.secret_key` | Секретный ключ доступа |
| `use_path_style` | Использовать ли доступ в формате path-style |

Свойства, которые **нельзя** изменять для **Storage Vault на базе HDFS**:

| Свойство | Причина |
|----------|--------|
| `path_prefix` | Изменение приводит к несогласованности путей к ранее сохранённым данным |
| `fs.defaultFS` | Изменение делает уже записанные данные недоступными |

Дополнительные описания свойств приведены в разделе [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT).

### Примеры {#examples}

Изменение Storage Vault на базе S3:

```sql
ALTER STORAGE VAULT old_s3_vault
PROPERTIES (
    "type"           = "S3",
    "VAULT_NAME"     = "new_s3_vault",
    "s3.access_key"  = "new_ak",
    "s3.secret_key"  = "new_sk"
);
```

Изменение Storage Vault на базе HDFS:

```sql
ALTER STORAGE VAULT old_hdfs_vault
PROPERTIES (
    "type"             = "hdfs",
    "VAULT_NAME"       = "new_hdfs_vault",
    "hadoop.username"  = "hdfs"
);
```

## Удаление Storage Vault {#delete-a-storage-vault}

Удаление Storage Vault в настоящее время не поддерживается.

## Управление доступом к Storage Vault {#storage-vault-access-control}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Storage access control in multi-user environments -->

Администраторы могут предоставлять указанным пользователям или ролям MySQL права на использование Storage Vault. Это позволяет управлять тем, какие пользователи могут ссылаться на Storage Vault при создании таблиц или просматривать сведения о нём.

Пользователь или роль с правом `USAGE_PRIV` для Storage Vault может выполнять следующие операции:

- Просматривать сведения о Storage Vault с помощью `SHOW STORAGE VAULTS`
- Указывать Storage Vault в `PROPERTIES` при создании таблицы

### Предоставление прав {#grant-permissions}

**Синтаксис**

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

**Пример**

```sql
GRANT USAGE_PRIV ON STORAGE VAULT my_storage_vault TO USER user1;
```

### Отзыв прав {#revoke-permissions}

**Синтаксис**

```sql
REVOKE
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

**Пример**

```sql
REVOKE USAGE_PRIV ON STORAGE VAULT my_storage_vault FROM USER user1;
```

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Routine operations and troubleshooting -->

### Q1: Как узнать, какие таблицы ссылаются на определённый Storage Vault? {#q1-how-do-i-find-out-which-tables-reference-a-specific-storage-vault}

**Шаг 1**: Выполните `SHOW STORAGE VAULTS`, чтобы узнать `storage_vault_id` нужного Storage Vault.

**Шаг 2**: Выполните следующий SQL-запрос, чтобы найти таблицы, ссылающиеся на этот Storage Vault. Замените `PROPERTY_VALUE=3` на фактическое значение `storage_vault_id`:

```sql
SELECT *
FROM information_schema.table_properties
WHERE PROPERTY_NAME = "storage_vault_id"
  AND PROPERTY_VALUE = 3;
```

Пример результата запроса:

```
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| TABLE_CATALOG | TABLE_SCHEMA                    | TABLE_NAME                          | PROPERTY_NAME    | PROPERTY_VALUE |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| internal      | regression_test_vault_p0_create | s3_92ba28c209154d968e680e58dd54d0cc | storage_vault_id | 3              |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
1 row in set (0.04 sec)
```

### Q2: Можно ли изменить Storage Vault после создания таблицы? {#q2-can-i-change-the-storage-vault-after-a-table-is-created}

Нет. После успешного создания таблицы её свойство `storage_vault` нельзя изменить. Если требуется использовать другой Storage Vault, необходимо заново создать таблицу и повторно загрузить данные.

### Q3: Влияет ли переименование Storage Vault на базы данных, которые ранее ссылались на него? {#q3-after-renaming-a-storage-vault-are-databases-that-previously-referenced-that-vault-affected}

Да. При изменении `VAULT_NAME` у Storage Vault настройка `storage_vault_name` на уровне базы данных может стать недействительной, что приведёт к ошибкам при создании новых таблиц в этой базе данных. Необходимо использовать [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md), чтобы заново задать для базы данных допустимое значение `storage_vault_name`.
