---
{
    "title": "CREATE-STORAGE-VAULT",
    "language": "ru",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "Эта команда используется для создания хранилища. В этом документе описан синтаксис создания самостоятельно управляемого хранилища в Doris."
}
---

## Описание {#description}

Эта команда используется для создания хранилища. В этом документе описан синтаксис создания самостоятельно управляемого хранилища в Doris.


## Синтаксис {#syntax}

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name> [ <properties> ]
```


## Обязательные параметры {#required-parameters}

| Параметр     | Описание                     |
|-------|-----------------------|
| `<vault_name>` | Имя хранилища. Это уникальный идентификатор создаваемого хранилища. |

## Необязательные параметры {#optional-parameters}
| Параметр   | Описание                                                         |
|-------------------|--------------------------------------------------------------|
| `[IF NOT EXISTS]` | Если указанное хранилище уже существует, операция создания не выполняется и ошибка не возникает. Это предотвращает повторное создание одного и того же хранилища. |
| `<properties>`    | Набор пар «ключ — значение» для настройки или обновления отдельных свойств хранилища. Каждое свойство состоит из ключа (<key>) и значения (<value>), разделённых знаком равенства (=). Несколько пар разделяются запятыми (,). |

:::note
Свойство `type` принимает только два значения: `"S3"` или `"hdfs"` (без учёта регистра). Все системы объектного хранения, включая Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, Huawei Cloud OBS, Baidu Cloud BOS, MinIO, Azure Blob Storage и Google Cloud Storage, используют `"type" = "S3"`, поскольку Doris обращается к ним через API, совместимый с S3. Конкретный облачный сервис задаётся отдельным свойством `provider` (`COS`, `OSS`, `S3`, `OBS`, `BOS`, `AZURE` или `GCP`). Имена свойств `s3.access_key` / `s3.secret_key` следуют тому же соглашению и не относятся исключительно к AWS S3.
:::

### Хранилище S3 {#s3-vault}

| Параметр              | Обязательность | Описание                                                                                                      |
|:----------------|:-----|:--------------------------------------------------------------------------------------------------------|
| `s3.endpoint`    | Обязателен   | Конечная точка объектного хранилища. Для Azure Blob Storage используется фиксированная конечная точка blob.core.windows.net. |
| `s3.region`      | Обязателен   | Регион вашего бакета хранилища. (Не требуется при использовании GCP или AZURE). |
| `s3.root.path`   | Обязателен   | Путь для хранения данных. |
| `s3.bucket`      | Обязателен   | Бакет вашей учётной записи объектного хранилища. (Для Azure это StorageAccount). |
| `s3.access_key`  | Обязателен   | Ключ доступа к вашей учётной записи объектного хранилища. (Для Azure это AccountName). |
| `s3.secret_key`  | Обязателен   | Секретный ключ вашей учётной записи объектного хранилища. (Для Azure это AccountKey). |
| `provider`       | Обязателен   | Облачный провайдер, предоставляющий сервис объектного хранения. Поддерживаемые значения: `COS`，`OSS`，`S3`，`OBS`，`BOS`，`AZURE`，`GCP` |
| `use_path_style` | Необязателен   | Использовать `path-style URL` (для сред с частным развёртыванием) или `virtual-hosted-style URL` (рекомендуется для публичных облачных сред). Значение по умолчанию: true (path-style).                                                                                   |

**Примечание:&#x20;**

1. Если в `s3.endpoint` не указан ни префикс `http://`, ни префикс `https://`, по умолчанию используется `http`. Если префикс задан явно, используется указанный префикс;

2. Doris также поддерживает `AWS Assume Role` для хранилищ S3 (пока только для AWS S3). Подробнее см. в разделе [Интеграция с AWS](../../../../lakehouse/storages/s3.md).

### Хранилище HDFS {#hdfs-vault}

| Параметр                               | Обязательность | Описание                                                    |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS`                   |Обязателен| Свойство конфигурации Hadoop, задающее файловую систему, используемую по умолчанию.                             |
| `path_prefix`                    |Необязателен| Префикс пути для хранения данных. Если не задан, используется путь по умолчанию в каталоге пользователя.                   |
| `hadoop.username`                |Необязателен| Свойство конфигурации Hadoop, задающее пользователя для доступа к файловой системе. Если не задано, используется пользователь, запустивший процесс Hadoop. |
| `hadoop.security.authentication` |Необязателен| Метод аутентификации Hadoop. Для использования Kerberos укажите kerberos.      |
| `hadoop.kerberos.principal`      |Необязателен| Путь к вашему principal Kerberos.      |
| `hadoop.kerberos.keytab`         |Необязателен| Путь к вашему keytab Kerberos.     |

## Примеры {#examples}

### 1. Создание хранилища HDFS. {#1-create-a-hdfs-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
PROPERTIES (
    "type" = "hdfs",                                     -- required
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",            -- required
    "path_prefix" = "big/data",                          -- optional,  generally fill in according to the business name
    "hadoop.username" = "user"                           -- optional
    "hadoop.security.authentication" = "kerberos"        -- optional
    "hadoop.kerberos.principal" = "hadoop/127.0.0.1@XXX" -- optional
    "hadoop.kerberos.keytab" = "/etc/emr.keytab"         -- optional
);
```

### 2. Создание хранилища OSS {#2-create-oss-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS oss_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",       -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your OSS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your OSS secret key
    "s3.region" = "cn-beijing",                          -- required
    "s3.root.path" = "oss_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your OSS bucket name
    "provider" = "OSS",                                  -- required
    "use_path_style" = "false"                           -- optional,  OSS recommended to set false
);
```

### 3. Создание хранилища COS {#3-create-cos-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS cos_demo_vault
PROPERTIES (
    "type" = "S3",
    "s3.endpoint" = "cos.ap-guangzhou.myqcloud.com",     -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your COS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your COS secret key
    "s3.region" = "ap-guangzhou",                        -- required
    "s3.root.path" = "cos_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your COS bucket name
    "provider" = "COS",                                  -- required
    "use_path_style" = "false"                           -- optional,  COS recommended to set false
);
```

### 4. Создание хранилища OBS {#4-create-obs-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS obs_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",  -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your OBS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your OBS secret key
    "s3.region" = "cn-north-4",                          -- required
    "s3.root.path" = "obs_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your OBS bucket name
    "provider" = "OBS",                                  -- required
    "use_path_style" = "false"                           -- optional,  OBS recommended to set false
);
```

### 5. Создание хранилища BOS {#5-create-bos-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS bos_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "s3.bj.bcebos.com",                  -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your BOS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your BOS secret key
    "s3.region" = "bj",                                  -- required
    "s3.root.path" = "bos_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your BOS bucket name
    "provider" = "BOS",                                  -- required
    "use_path_style" = "false"                           -- optional,  BOS recommended to set false
);
```

### 6. Создание хранилища S3 {#6-create-s3-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",                                      -- required
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",       -- required
    "s3.access_key" = "xxxxxx",                         -- required,  Your S3 access key
    "s3.secret_key" = "xxxxxx",                         -- required,  Your S3 secret key
    "s3.region" = "us-east-1",                          -- required
    "s3.root.path" = "s3_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                             -- required,  Your S3 bucket name
    "provider" = "S3",                                  -- required
    "use_path_style" = "false"                          -- optional,  S3 recommended to set false
);
```

**Примечание:&#x20;**

Doris также поддерживает `AWS Assume Role` для хранилищ S3 (пока только для AWS S3). Подробнее см. в разделе [Интеграция с AWS](../../../../lakehouse/storages/s3.md)


### 7. Создание хранилища MinIO {#7-create-minio-storage-vault}

```sql
 CREATE STORAGE VAULT IF NOT EXISTS minio_demo_vault
 PROPERTIES (
     "type" = "S3",                                     -- required
     "s3.endpoint" = "127.0.0.1:9000",                  -- required
     "s3.access_key" = "xxxxxx",                        -- required,  Your minio access key
     "s3.secret_key" = "xxxxxx",                        -- required,  Your minio secret key
     "s3.region" = "us-east-1",                         -- required
     "s3.root.path" = "minio_demo_vault_prefix",        -- required
     "s3.bucket" = "xxxxxx",                            -- required,  Your minio bucket name
     "provider" = "S3",                                 -- required
     "use_path_style" = "true"                          -- required,  minio recommended to set false
 );
```

### 8. Создание хранилища AZURE {#8-create-azure-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS azure_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "blob.core.windows.net",             -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your Azure AccountName
    "s3.secret_key" = "xxxxxx",                          -- required,  Your Azure AccountKey
    "s3.region" = "us-east-1",                           -- required
    "s3.root.path" = "azure_demo_vault_prefix",          -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your Azure StorageAccount
    "provider" = "AZURE"                                 -- required
);
```

### 9. Создание хранилища GCP {#9-create-gcp-storage-vault}

```sql
CREATE STORAGE VAULT IF NOT EXISTS gcp_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "storage.googleapis.com",            -- required
    "s3.access_key" = "xxxxxx",                          -- required
    "s3.secret_key" = "xxxxxx",                          -- required
    "s3.region" = "us-east-1",                           -- required
    "s3.root.path" = "gcp_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required
    "provider" = "GCP"                                   -- required
);
```

**Примечание**

[Параметр s3.access_key соответствует Access ID ключа HMAC в GCP](https://cloud.google.com/storage/docs/authentication/hmackeys)

[Параметр s3.secret_key соответствует Secret ключа HMAC в GCP](https://cloud.google.com/storage/docs/authentication/hmackeys)

## Ключевые слова {#keywords}

    CREATE, STORAGE VAULT
