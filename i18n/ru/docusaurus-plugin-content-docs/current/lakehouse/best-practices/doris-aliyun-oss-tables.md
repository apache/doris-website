---
{
    "title": "Интеграция с Alibaba Cloud OSS Tables",
    "language": "ru",
    "description": "Подключение Doris к Alibaba Cloud OSS Tables с помощью Iceberg REST Catalog и S3FileIO для чтения и записи управляемых таблиц Iceberg.",
    "keywords": [
        "Alibaba Cloud OSS Tables",
        "Apache Doris OSS Tables",
        "Iceberg REST Catalog",
        "S3FileIO",
        "OSS Table Bucket",
        "OSS Tables Catalog",
        "управляемые таблицы Iceberg",
        "SigV4 osstables",
        "OSS Tables 403 Forbidden",
        "учётные данные OSS STS",
        "lakehouse на Doris"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Integration Guide -->
<!-- Applicable Scenarios: Alibaba Cloud OSS Tables integration / Managed Iceberg table queries and writes -->

[Alibaba Cloud OSS Tables](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables/) — это сервис управляемого хранения таблиц Apache Iceberg. OSS Tables использует Table Buckets в качестве единиц хранения, предоставляет интерфейс метаданных, совместимый с Apache Iceberg REST Catalog, и обеспечивает доступ к данным таблиц через S3-совместимый интерфейс OSS.

По сравнению с самостоятельным управлением таблицами Iceberg в обычном OSS Bucket, OSS Tables предоставляет следующие возможности:

- Встроенный Iceberg REST Catalog, который избавляет от необходимости развёртывать внешнюю службу метаданных, например Hive Metastore.
- Автоматическая компакция мелких файлов, удаление устаревших снимков и очистка файлов, на которые нет ссылок.
- Стандартные интерфейсы Iceberg, позволяющие нескольким вычислительным движкам обращаться к одним и тем же данным таблиц.

Apache Doris подключается к OSS Tables через Iceberg REST Catalog: REST Catalog управляет пространствами имён и метаданными таблиц, а `S3FileIO` читает и записывает файлы данных. В этом руководстве описано, как создать OSS Tables Catalog в Doris, выполнять запросы к таблицам Iceberg и записывать в них данные.

:::caution
Эта функция является экспериментальной и поддерживается начиная с Doris 4.1.4.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Creating an OSS Tables Catalog / Querying and writing Iceberg tables -->

## Руководство по использованию {#usage-guide}

### 01 Создание OSS Table Bucket {#01-create-an-oss-table-bucket}

Создайте Table Bucket в консоли Alibaba Cloud OSS. После создания сохраните ARN, регион и имя Table Bucket. ARN имеет следующий формат:

```text
acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>
```

Создайте AccessKey для пользователя RAM с доступом к целевому Table Bucket или получите временные учётные данные STS. Убедитесь, что узлы FE могут обращаться к конечной точке OSS Tables REST Catalog, а узлы FE и BE могут обращаться к конечной точке доступа к данным OSS.

Сведения о разрешениях, необходимых для каждой операции OSS Tables, см. в разделе [Разрешения и управление доступом в Alibaba Cloud OSS Tables](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables-access-control).

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Configuring REST Catalog authentication and S3FileIO data access -->

### 02 Создание Iceberg Catalog {#02-create-an-iceberg-catalog}

Замените регион, идентификатор учётной записи, имя Table Bucket и учётные данные для доступа фактическими значениями:

```sql
CREATE CATALOG oss_tables PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<region>.oss-tables.aliyuncs.com/iceberg',
    'warehouse' = 'acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>',

    'iceberg.rest.sigv4-enabled' = 'true',
    'iceberg.rest.signing-name' = 'osstables',
    'iceberg.rest.signing-region' = '<region>',
    'iceberg.rest.view-enabled' = 'false',

    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'oss.endpoint' = 'https://oss-<region>.aliyuncs.com',
    'oss.region' = '<region>',
    'oss.access_key' = '<access_key_id>',
    'oss.secret_key' = '<access_key_secret>',
    'oss.use_path_style' = 'false',

    'test_connection' = 'true'
);
```

Для доступа к Alibaba Cloud через внутреннюю сеть замените `iceberg.rest.uri` и `oss.endpoint` на `https://<region>-internal.oss-tables.aliyuncs.com/iceberg` и `https://oss-<region>-internal.aliyuncs.com` соответственно.

При использовании временных учётных данных STS добавьте `oss.session_token` после `oss.secret_key`:

```sql
'oss.session_token' = '<sts_token>',
```

Doris использует `oss.access_key`, `oss.secret_key` и необязательный `oss.session_token` как для подписи запросов к REST Catalog по протоколу SigV4, так и для доступа к данным через `S3FileIO`. Отдельно настраивать `iceberg.rest.access-key-id` и `iceberg.rest.secret-access-key` не требуется.

#### Параметры {#parameters}

| Параметр | Обязательный | Описание |
| --- | --- | --- |
| `type` | Да | Должен иметь значение `iceberg`. |
| `iceberg.catalog.type` | Да | Должен иметь значение `rest` для доступа к OSS Tables через Iceberg REST Catalog. |
| `iceberg.rest.uri` | Да | Конечная точка OSS Tables REST Catalog. |
| `warehouse` | Да | ARN для Table Bucket. |
| `iceberg.rest.sigv4-enabled` | Да | Должен иметь значение `true`. |
| `iceberg.rest.signing-name` | Да | Должен иметь значение `osstables` в нижнем регистре. Это значение чувствительно к регистру. |
| `iceberg.rest.signing-region` | Да | Регион для подписи SigV4. Должен совпадать с регионом Table Bucket. |
| `iceberg.rest.view-enabled` | Да | Установите значение `false`. OSS Tables в настоящее время не поддерживает интерфейс Iceberg View. |
| `io-impl` | Да | Должен иметь значение `org.apache.iceberg.aws.s3.S3FileIO`. Не используйте `HadoopFileIO`. |
| `oss.endpoint` | Да | Конечная точка, которую `S3FileIO` использует для доступа к файлам данных OSS. |
| `oss.region` | Да | Регион доступа к данным OSS. Должен совпадать с регионом Table Bucket. |
| `oss.access_key` | Да | AccessKey ID для Alibaba Cloud. |
| `oss.secret_key` | Да | AccessKey Secret для Alibaba Cloud. |
| `oss.session_token` | Нет | Укажите этот параметр при использовании временных учётных данных STS. |
| `oss.use_path_style` | Нет | Определяет, используется ли доступ в стиле path-style. Значение по умолчанию: `false`. |
| `test_connection` | Нет | Если установлено значение `true`, Doris проверяет подключение к REST Catalog и аутентификацию при создании Catalog. |

`test_connection=true` не заменяет проверку доступа к данным. После создания Catalog выполните реальный запрос или операцию записи, чтобы проверить сетевую доступность конечной точки доступа к данным OSS с узлов FE и BE и необходимые разрешения.

### 03 Доступ к OSS Tables {#03-access-oss-tables}

```sql
SWITCH oss_tables;

SHOW DATABASES;

USE <namespace_name>;

SHOW TABLES;

SELECT * FROM <table_name> LIMIT 10;
```

<!-- Knowledge Type: Operational Example -->
<!-- Applicable Scenarios: Creating an Iceberg table and writing data to OSS Tables -->

### 04 Создание таблицы OSS Tables и запись данных {#04-create-an-oss-tables-table-and-write-data}

```sql
SWITCH oss_tables;

CREATE DATABASE IF NOT EXISTS doris_demo;
USE doris_demo;

CREATE TABLE orders (
    order_id BIGINT,
    customer STRING,
    amount DECIMAL(10, 2),
    created_at DATETIME
)
PROPERTIES (
    'format-version' = '2',
    'write-format' = 'parquet',
    'write.format.default' = 'parquet',
    'write.parquet.compression-codec' = 'zstd'
);

INSERT INTO orders VALUES
    (1, 'Alice', 99.50, '2026-08-11 10:00:00'),
    (2, 'Bob', 120.00, '2026-08-11 10:01:00');

SELECT order_id, customer, amount, created_at
FROM orders
ORDER BY order_id;
```

```text
order_id  customer  amount  created_at
1         Alice     99.50   2026-08-11 10:00:00
2         Bob       120.00  2026-08-11 10:01:00
```

Чтобы убедиться, что файлы данных записаны в OSS Tables, можно выполнить запрос к таблице метаданных Iceberg `$files`:

```sql
SELECT file_path, file_format, record_count
FROM `orders$files`
ORDER BY file_path;
```

<!-- Knowledge Type: Limitations + Usage Guidance -->

## Примечания по использованию {#usage-notes}

- OSS Tables поддерживает только формат таблиц Iceberg.
- Для `iceberg.rest.signing-name` необходимо установить значение `osstables` в нижнем регистре. Также необходимо указать правильный `iceberg.rest.signing-region` и установить для `iceberg.rest.sigv4-enabled` значение `true`.
- При использовании временных учётных данных STS обновите AK, SK и токен в Catalog до истечения срока их действия.

<!-- Knowledge Type: Troubleshooting -->
<!-- Applicable Scenarios: 403 authentication errors / Metadata access succeeds but data queries fail -->

## Часто задаваемые вопросы {#faq}

### При создании Catalog возвращается ошибка 403 Forbidden {#creating-the-catalog-returns-403-forbidden}

Проверьте следующие настройки:

- Убедитесь, что `oss.access_key` и `oss.secret_key` действительны. При использовании временных учётных данных STS также убедитесь, что `oss.session_token` указан правильно и срок его действия не истёк.
- Убедитесь, что пользователь RAM или субъект STS имеет разрешения `oss:GetTableBucket` и `oss:ListNamespaces` для целевого Table Bucket.
- Убедитесь, что идентификатор учётной записи, регион и имя Table Bucket в `warehouse` указаны правильно.
- Убедитесь, что `iceberg.rest.signing-name` имеет значение `osstables`, а `iceberg.rest.signing-region` соответствует региону Table Bucket.

### Пространства имён и таблицы видны, но запросы к данным завершаются ошибкой {#namespaces-and-tables-are-visible-but-data-queries-fail}

Убедитесь, что FE и все узлы BE могут обращаться к `oss.endpoint`, а пользователь RAM или субъект STS имеет разрешения `oss:GetTableMetadataLocation` и `oss:GetTableData`.

Полный список разрешений, необходимых для операций OSS Tables, см. в разделе [Разрешения и управление доступом в Alibaba Cloud OSS Tables](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables-access-control).
