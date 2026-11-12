---
{
    "title": "API Iceberg Rest Catalog",
    "language": "ru",
    "description": "В этом документе описаны поддерживаемые параметры подключения и доступа к сервисам метаданных, реализующим интерфейс Iceberg Rest Catalog "
}
---

В этом документе описаны поддерживаемые параметры подключения и доступа к сервисам метаданных, реализующим интерфейс Iceberg Rest Catalog, с помощью оператора `CREATE CATALOG`.

## Обзор параметров {#parameter-overview}

| Имя свойства | Прежнее имя | Описание | Значение по умолчанию | Обязательный |
| --- | --- | --- | --- | --- | 
| iceberg.rest.uri | uri | Задаёт адрес сервиса Rest | - | Да |
| warehouse | warehouse | Задаёт хранилище Iceberg | - | Да |
| iceberg.rest.security.type | | Задаёт метод аутентификации сервиса Rest. Поддерживается `oauth2`, по умолчанию используется `none` (без аутентификации) | `none` | Нет |
| iceberg.rest.oauth2.token | | Токен Bearer при использовании аутентификации `oauth2` | - | Нет |
| iceberg.rest.oauth2.scope | | Задаёт область ресурсов и уровень прав, доступные пользователям после авторизации при использовании аутентификации `oauth2` | - | Нет |
| iceberg.rest.oauth2.credential | | Учётные данные `oauth2`, используемые для обращения к `server-uri` и получения токена | - | Нет |
| iceberg.rest.oauth2.server-uri | | URI для получения токена `oauth2`, используется совместно с `iceberg.rest.oauth2.credential` | - | Нет |
| iceberg.rest.vended-credentials-enabled | | Определяет, следует ли включить функцию `vended-credentials`. Если она включена, учётные данные для доступа к системе хранения, такие как `access-key` и `secret-key`, будут получены от сервера Rest, поэтому указывать их вручную не потребуется. Сервер Rest должен поддерживать эту возможность. | `false` | Нет |
| iceberg.rest.nested-namespace-enabled | | (Поддерживается начиная с версии 3.1.2+) Определяет, следует ли включить поддержку вложенных пространств имён (Nested Namespace). Значение по умолчанию: `false`. При значении `true` вложенные пространства имён представляются в плоском виде и отображаются как имена баз данных, например `parent_ns.child_ns`. Некоторые сервисы Rest Catalog, например AWS Glue, не поддерживают вложенные пространства имён, поэтому для этого параметра следует установить значение `false` | Нет |

> Примечание:
>
> 1. Аутентификация OAuth2 и функция `vended-credentials` поддерживаются начиная с версии 3.1.0.
>
> 2. Для версий до 3.1.0 используйте прежние имена параметров.
>
> 3. Для AWS Glue Rest Catalog см. [документацию AWS Glue](./aws-glue.md)

## Вложенные пространства имён {#nested-namespace}

Начиная с версии 3.1.2, для полноценного доступа к вложенным пространствам имён помимо установки параметра `iceberg.rest.nested-namespace-enabled` в значение `true` в свойствах Catalog необходимо также включить следующий глобальный параметр:

```
SET GLOBAL enable_nested_namespace=true;
```

Если Catalog называется "ice", пространство имён называется "ns1.ns2", а таблица называется "tbl1", обращаться к вложенному пространству имён можно следующими способами:

```sql
mysql> USE ice.ns1.ns2;
mysql> SELECT k1 FROM ice.`ns1.ns2`.tbl1;
mysql> SELECT tbl1.k1 FROM `ns1.ns2`.tbl1;
mysql> SELECT `ns1.ns2`.tbl1.k1 FROM ice.`ns1.ns2`.tbl1;
mysql> SELECT ice.`ns1.ns2`.tbl1.k1 FROM tbl1;
mysql> REFRESH CATALOG ice;
mysql> REFRESH DATABASE ice.`ns1.ns2`;
mysql> REFRESH TABLE ice.`ns1.ns2`.tbl1;
```

## Примеры конфигураций {#example-configurations}

- Сервис Rest Catalog без аутентификации

    ```sql
    CREATE CATALOG minio_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'uri' = 'http://172.21.0.1:8181',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'http://10.0.0.1:9000',
        's3.region' = 'us-east-1'
    );
    ```

- Подключение к AWS Glue Rest Catalog

    ```sql
    CREATE CATALOG glue_iceberg PROPERTIES (
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

- Подключение к Databricks Unity Iceberg Rest Catalog

    ```sql
    CREATE CATALOG unity_iceberg properties(
        "uri" = "https://dbc-59918a85-6c3a.cloud.databricks.com/api/2.1/unity-catalog/iceberg-rest/",
        "type" = "iceberg",
        "warehouse" = "<catalog_name>",
        "iceberg.catalog.type" = "rest",
        "iceberg.rest.security.type" = "oauth2",
        "iceberg.rest.oauth2.token" = "<token>",
        "iceberg.rest.vended-credentials-enabled" = "true",
        's3.endpoint' = 'https://s3.us-east-2.amazonaws.com',
        's3.region' = 'us-east-2'
    );
    ```

- Подключение к Apache Polaris Rest Catalog

    ```sql
    -- Enable vended-credentials
    CREATE CATALOG polaris_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
        'warehouse' = '<catalog_name>',
        'iceberg.rest.security.type' = 'oauth2',
        'iceberg.rest.oauth2.credential' = 'client_id:client_secret',
        'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
        'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2'
    );

    -- Disable vended-credentials
    CREATE CATALOG polaris_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog',
        'warehouse' = '<catalog_name>',
        'iceberg.rest.security.type' = 'oauth2',
        'iceberg.rest.oauth2.credential' = '6e155b128dc06c13:ce9fbb4cc91c43ff2955f2c6545239d7',
        'iceberg.rest.oauth2.server-uri' = 'http://YOUR_POLARIS_HOST:8181/api/catalog/v1/oauth/tokens',
        'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:doris_pr_role',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2'
    );
    ```

- Подключение к Snowflake Open Catalog (начиная с версии 3.1.2)

    ```sql
    -- Enable vended-credentials
    CREATE CATALOG snowflake_open_catalog PROPERTIES (
        'type' = 'iceberg',
        'warehouse' = '<catalog_name>',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'https://<open_catalog_account>.snowflakecomputing.com/polaris/api/catalog',
        'iceberg.rest.security.type' = 'oauth2',
        'iceberg.rest.oauth2.credential' = '<client_id>:<client_secret>',
        'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:<principal_role>',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2',
        'iceberg.rest.nested-namespace-enabled' = 'true'
    );
    ```

    ```sql
    -- Disable vended-credentials
    CREATE CATALOG snowflake_open_catalog PROPERTIES (
        'type' = 'iceberg',
        'warehouse' = '<catalog_name>',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'https://<open_catalog_account>.snowflakecomputing.com/polaris/api/catalog',
        'iceberg.rest.security.type' = 'oauth2',
        'iceberg.rest.oauth2.credential' = '<client_id>:<client_secret>',
        'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:<principal_role>',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2',
        'iceberg.rest.nested-namespace-enabled' = 'true'
    );
    ```

- Подключение к Apache Gravitino Rest Catalog

    ```sql
    -- Enable vended-credentials
    CREATE CATALOG gravitino_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://127.0.0.1:9001/iceberg/',
        'warehouse' = 's3://gravitino-iceberg-demo/warehouse',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2'
    );

    -- Disable vended-credentials
    CREATE CATALOG gravitino_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://127.0.0.1:9001/iceberg/',
        'warehouse' = 's3://gravitino-iceberg-demo/warehouse',
        'iceberg.rest.vended-credentials-enabled' = 'false',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'https://s3.us-west-2.amazonaws.com',
        's3.region' = 'us-west-2'
    );
    ```

- Подключение к SeaweedFS Rest Catalog

    ```sql
    CREATE CATALOG seaweedfs_iceberg PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'uri' = 'http://<seaweedfs_host>:8181',
        'warehouse' = 's3://<table_bucket_name>',
        'credential' = '<ak>:<sk>',
        's3.access_key' = '<ak>',
        's3.secret_key' = '<sk>',
        's3.endpoint' = 'http://<seaweedfs_host>:8333',
        's3.region' = 'us-west-2',
        'use_path_style' = 'true'
    );
    ```

    Бакеты таблиц SeaweedFS предоставляют Iceberg REST Catalog для работы с метаданными таблиц и хранят данные таблиц в виде файлов Parquet за тем же шлюзом S3. Подробное пошаговое руководство см. в разделе [Интеграция с SeaweedFS](../best-practices/doris-seaweedfs.md).
