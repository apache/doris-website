---
{
    "title": "AWS Glue",
    "language": "ru",
    "description": "В этом документе описана настройка параметров при использовании AWS Glue Catalog для доступа к таблицам Iceberg или Hive с помощью CREATE CATALOG."
}
---

В этом документе описана настройка параметров при использовании **AWS Glue Catalog** для доступа к **таблицам Iceberg** или **таблицам Hive** с помощью `CREATE CATALOG`.

## Поддерживаемые типы Glue Catalog {#supported-glue-catalog-types}

В настоящее время AWS Glue Catalog поддерживает три типа Catalog:

| Тип Catalog | Идентификатор типа (`type`) | Описание                                    |
|-------------|-------------------------|------------------------------------------------|
| Hive        | glue                    | Catalog для подключения к Hive Metastore      |
| Iceberg     | glue                    | Catalog для работы с форматом таблиц Iceberg |
| Iceberg     | rest                    | Catalog для работы с форматом таблиц Iceberg через Glue Rest Catalog |

В этой документации приведены подробные описания параметров для каждого типа, которые помогут выполнить настройку.

## Обзор общих параметров {#common-parameters-overview}
| Имя параметра            | Описание                                                   | Обязательный | Значение по умолчанию |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `glue.region`            | Регион AWS Glue, например, `us-east-1`                          | Да      | Нет          |
| `glue.endpoint`          | Конечная точка AWS Glue, например, `https://glue.us-east-1.amazonaws.com` | Да      | Нет          |
| `glue.access_key`        | AWS Access Key ID                                            | Да      | Пусто         |
| `glue.secret_key`        | AWS Secret Access Key                                        | Да      | Пусто         |
| `glue.catalog_id`        | ID Glue Catalog (пока не поддерживается)                         | Нет       | Пусто         |
| `glue.role_arn`          | IAM Role ARN для доступа к Glue (поддерживается с версии 3.1.2+)   | Нет       | Пусто         |
| `glue.external_id`       | IAM External ID для доступа к Glue (поддерживается с версии 3.1.2+) | Нет       | Пусто         |

### Параметры аутентификации {#authentication-parameters}

Для доступа к Glue требуются данные аутентификации. Поддерживаются следующие два способа:

1. Аутентификация с помощью Access Key

   Доступ к Glue аутентифицируется с помощью Access Key, заданного параметрами `glue.access_key` и `glue.secret_key`.

2. Аутентификация с помощью IAM Role (поддерживается с версии 3.1.2+)

   Доступ к Glue аутентифицируется с помощью IAM Role, заданной параметром `glue.role_arn`.

   Для этого способа Doris должен быть развёрнут на AWS EC2, а экземпляр EC2 должен быть связан с IAM Role, у которой есть разрешение на доступ к Glue.

   Если требуется доступ с использованием External ID, необходимо также настроить `glue.external_id`.

Примечания:

- Необходимо настроить хотя бы один из двух способов. Если настроены оба, приоритет имеет аутентификация с помощью Access Key.

Пример:

    ```sql
    CREATE CATALOG hive_glue_catalog PROPERTIES (
      'type' = 'hms',
      'hive.metastore.type' = 'glue',
      'glue.region' = 'us-east-1',
      'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
      -- Using Access Key authentication
      'glue.access_key' = '<YOUR_ACCESS_KEY>',
      'glue.secret_key' = '<YOUR_SECRET_KEY>'
      -- Or using IAM Role authentication
      -- 'glue.role_arn' = '<YOUR_ROLE_ARN>',
      -- 'glue.external_id' = '<YOUR_EXTERNAL_ID>'
    );
    ```

Инструкции по настройке аутентификации и авторизации AWS приведены в документе [Аутентификация и авторизация AWS](../../admin-manual/auth/integrations/aws-authentication-and-authorization.md)

### Hive Glue Catalog {#hive-glue-catalog}

Hive Glue Catalog используется для доступа к таблицам Hive через интерфейс AWS Glue, совместимый с Hive Metastore. Параметры настройки:

| Имя параметра            | Описание                                                   | Обязательный | Значение по умолчанию |
|--------------------------|---------------------------------------------------------------|----------|---------------|
| `type`                   | Фиксированное значение: `hms`                                               | Да      | Нет          |
| `hive.metastore.type`    | Фиксированное значение: `glue`                                              | Да      | Нет          |
| `glue.region`            | Регион AWS Glue, например, `us-east-1`                          | Да      | Нет          |
| `glue.endpoint`          | Конечная точка AWS Glue, например, `https://glue.us-east-1.amazonaws.com` | Да      | Нет          |
| `glue.access_key`        | AWS Access Key ID                                            | Нет       | Пусто         |
| `glue.secret_key`        | AWS Secret Access Key                                        | Нет       | Пусто         |
| `glue.catalog_id`        | ID Glue Catalog (пока не поддерживается)                         | Нет       | Пусто         |
| `glue.role_arn`          | IAM Role ARN для доступа к Glue                             | Нет       | Пусто         |
| `glue.external_id`       | IAM External ID для доступа к Glue                          | Нет       | Пусто         |

#### Пример {#example}

```sql
CREATE CATALOG hive_glue_catalog PROPERTIES (
  'type' = 'hms',
  'hive.metastore.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = 'YOUR_ACCESS_KEY',
  'glue.secret_key' = 'YOUR_SECRET_KEY'
);
```

### Iceberg Glue Catalog {#iceberg-glue-catalog}

Iceberg Glue Catalog обращается к Glue через Glue Client. Параметры настройки:

| Имя параметра          | Описание                                                      | Обязательный | Значение по умолчанию |
|------------------------|------------------------------------------------------------------|----------|---------------|
| `type`                 | Фиксированное значение: `iceberg`                                               | Да      | Нет          |
| `iceberg.catalog.type` | Фиксированное значение: `glue`                                                  | Да      | Нет          |
| `warehouse`            | Путь к хранилищу данных Iceberg, например, `s3://my-bucket/iceberg-warehouse/` | Да      | s3://doris    |
| `glue.region`          | Регион AWS Glue, например, `us-east-1`                             | Да      | Нет          |
| `glue.endpoint`        | Конечная точка AWS Glue, например, `https://glue.us-east-1.amazonaws.com` | Да      | Нет          |
| `glue.access_key`      | AWS Access Key ID                                               | Нет       | Пусто         |
| `glue.secret_key`      | AWS Secret Access Key                                           | Нет       | Пусто         |
| `glue.catalog_id`      | ID Glue Catalog (пока не поддерживается)                            | Нет       | Пусто         |
| `glue.role_arn`        | IAM Role ARN для доступа к Glue (пока не поддерживается)            | Нет       | Пусто         |
| `glue.external_id`     | IAM External ID для доступа к Glue (пока не поддерживается)         | Нет       | Пусто         |

#### Пример {#example-1}

```sql
CREATE CATALOG iceberg_glue_catalog PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'glue',
  'glue.region' = 'us-east-1',
  'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com',
  'glue.access_key' = '<YOUR_ACCESS_KEY>',
  'glue.secret_key' = '<YOUR_SECRET_KEY>'
);
```

### Iceberg Glue Rest Catalog {#iceberg-glue-rest-catalog}

Iceberg Glue Rest Catalog обращается к Glue через интерфейс Glue Rest Catalog. В настоящее время поддерживаются только таблицы Iceberg, хранящиеся в AWS S3 Table Bucket. Параметры настройки:

| Имя параметра                   | Описание                                                       | Обязательный | Значение по умолчанию |
|----------------------------------|-------------------------------------------------------------------|----------|---------------|
| `type`                           | Фиксированное значение: `iceberg`                                                | Да      | Нет          |
| `iceberg.catalog.type`           | Фиксированное значение: `rest`                                                   | Да      | Нет          |
| `iceberg.rest.uri`               | Конечная точка сервиса Glue Rest, например, `https://glue.ap-east-1.amazonaws.com/iceberg` | Да      | Нет          |
| `warehouse`                      | Путь к хранилищу данных Iceberg, например, `<account_id>:s3tablescatalog/<bucket_name>` | Да      | Нет          |
| `iceberg.rest.sigv4-enabled`     | Включение формата подписи V4; фиксированное значение: `true`                      | Да      | Нет          |
| `iceberg.rest.signing-name`      | Тип подписи; фиксированное значение: `glue`                                  | Да      | Пусто         |
| `iceberg.rest.access-key-id`     | Access Key для доступа к Glue (также используется для доступа к S3 Bucket) | Да      | Пусто         |
| `iceberg.rest.secret-access-key` | Secret Key для доступа к Glue (также используется для доступа к S3 Bucket) | Да      | Пусто         |
| `iceberg.rest.signing-region`    | Регион AWS Glue, например, `us-east-1`                              | Да      | Пусто         |

#### Пример {#example-2}

```sql
CREATE CATALOG glue_s3 PROPERTIES (
  'type' = 'iceberg',
  'iceberg.catalog.type' = 'rest',
  'iceberg.rest.uri' = 'https://glue.<region>.amazonaws.com/iceberg',
  'warehouse' = '<acount_id>:s3tablescatalog/<s3_table_bucket_name>',
  'iceberg.rest.sigv4-enabled' = 'true',
  'iceberg.rest.signing-name' = 'glue',
  'iceberg.rest.access-key-id' = '<ak>',
  'iceberg.rest.secret-access-key' = '<sk>',
  'iceberg.rest.signing-region' = '<region>'
);
```


## Политики разрешений {#permission-policies}

В зависимости от сценария использования политики делятся на политики **только для чтения** и **для чтения и записи**.

### 1. Разрешения только на чтение {#1-read-only-permissions}

Разрешает только чтение сведений о базах данных и таблицах из Glue Catalog.

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadOnly",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### 2. Разрешения на чтение и запись {#2-read-write-permissions}

В дополнение к разрешениям на чтение позволяет создавать, изменять и удалять базы данных и таблицы.

``` json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueCatalogReadWrite",
      "Effect": "Allow",
      "Action": [
        "glue:GetCatalog",
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions",
        "glue:CreateDatabase",
        "glue:UpdateDatabase",
        "glue:DeleteDatabase",
        "glue:CreateTable",
        "glue:UpdateTable",
        "glue:DeleteTable"
      ],
      "Resource": [
        "arn:aws:glue:<region>:<account-id>:catalog",
        "arn:aws:glue:<region>:<account-id>:database/*",
        "arn:aws:glue:<region>:<account-id>:table/*/*"
      ]
    }
  ]
}
```

### Примечания {#notes}

1. Замена заполнителей

    - `<region>` → Ваш регион AWS (например, `us-east-1`).
    - `<account-id>` → ID вашей учётной записи AWS (12-значное число).

2. Принцип минимальных привилегий

    - Если выполняются только запросы, не предоставляйте разрешения на запись.
    - Для дополнительного ограничения разрешений можно заменить `*` конкретными ARN баз данных или таблиц.

3. Разрешения S3

    - Приведённые выше политики относятся только к Glue Catalog.
    - Для чтения файлов данных нужны дополнительные разрешения S3 (например, `s3:GetObject`, `s3:ListBucket` и т. д.).
